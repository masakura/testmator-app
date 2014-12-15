var Testmator = (function ($, _) { // jshint ignore:line
  'use strict';

  // Helper function inheritance, like Backbone's extend.
  var extend = function (prototypePropeties, staticProperties) {
    var parent = this;
    var child;

    if (prototypePropeties && _.has(prototypePropeties, 'constructor')) {
      child = prototypePropeties.constructor;
    } else {
      child = function () { return parent.apply(this, arguments); };
    }

    // Extend static properties.
    _.extend(child, parent, staticProperties);

    // Extend constructor.
    var Surrogate = function () { this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate();

    // Extend prototype properties.
    if (prototypePropeties) {
      _.extend(child.prototype, prototypePropeties);
    }

    return child;
  };

  // Wrap automator from page object.
  var wrapAutomator = function (page) {
    var promise = Testmator.$.Deferred().resolve(page).promise();

    var wrap = function (promise) {
      var then = function () {
        return wrap(promise.then.apply(promise, arguments));
      };

      var done = function () {
        return wrap(promise.done.apply(promise, arguments));
      };

      return {
        getPage: function () {
          return page;
        },
        action: function (filter) {
          return then(function (target) {
            return filter.call(target, target);
          });
        },
        scope: function (filter) {
          return then(function (target) {
            return filter.call(target, target) || page;
          });
        },
        test: function (filter) {
          return then(function (target) {
            filter.call(target, target);
            return page;
          });
        },
        done: function () {
          return done.apply(promise, arguments);
        }
      };
    };

    return wrap(promise);
  };

  // Use named action.
  // ex: .action('clickAt', 0)
  var appendNamedAction = function (automator) {
    var action = function () {
      var args = _.toArray(arguments);
      var methodName = args.shift();

      if (_.isString(methodName)) {
        // .action('clickAt', 0)
        return automator.action.call(automator, function (target) {
          return target[methodName].apply(target, args);
        });
      } else {
        // .action(function (target) { target.clickAt(0); })
        return automator.action.apply(automator, arguments);
      }
    };

    var wrapped = _.chain(automator)
      .functions()
      .without('getPage')
      .map(function (name) {
        return [
          name,
          function () { return appendNamedAction(automator[name].apply(automator, arguments)); }
        ];
      })
      .object()
      .value();

    _.extend(wrapped, {
      getpage: function () {
        return automator.getPage();
      },
      action: function () {
        return appendNamedAction(action.apply(automator, arguments));
      }
    });

    return wrapped;
  };

  return {
    $: $,
    // Page object base type.
    PageObject: (function () {
      var PageObject = function (options) {
        var el = (options && options.el) || (options);

        this.el = (_.isFunction (el) && el()) || (el instanceof $ && el[0]) || (el instanceof HTMLElement) || document;
        this.$el = Testmator.$(this.el);

        this.parent = options && options.parent;

        if (_.isFunction(this.initialize)) {
          this.initialize.apply(this, arguments);
        }
      };

      _.extend(PageObject.prototype, {
        $: function () {
          return this.$el.find.apply(this.$el, arguments);
        },
        click: function (selector) {
          this.$(selector).trigger(PageObject.clickEventName);
          return this;
        },
        switchParent: function () {
          return this.parent;
        }
      });

      _.extend(PageObject, {
        clickEventName: 'click'
      });

      PageObject.extend = extend;

      return PageObject;
    })(),
    wrap: function (page) {
      return appendNamedAction(wrapAutomator(page));
    }
  };
})(jQuery || $, _);
