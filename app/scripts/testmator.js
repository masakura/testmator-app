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
        var args = _.toArray(arguments);
        var filter = _.first(args);
        args[0] = function (target) {
          var result = filter.call(target, target);
          return (result && result.getPromise && result.getPromise()) || result;
        };

        return wrap(promise.then.apply(promise, args));
      };

      var done = function () {
        return wrap(promise.done.apply(promise, arguments));
      };

      return {
        name: 'AUTOMATOR',
        getPage: function () {
          return page;
        },
        getPromise: function () {
          return promise;
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
    var createWrapper = function (automator) {
      return {
        name: 'NAMED',
        getPage: $.proxy(automator.getPage, automator),
        getPromise: $.proxy(automator.getPromise, automator),
        action: function () {
          return appendNamedAction(automator.action.apply(automator, arguments));
        },
        scope: function () {
          return appendNamedAction(automator.scope.apply(automator, arguments));
        },
        test: function () {
          return appendNamedAction(automator.test.apply(automator, arguments));
        },
        done: function () {
          return automator.done.apply(automator, arguments);
        }
      };
    };

    var wrapper = createWrapper(automator);
    var action = wrapper.action;
    wrapper.action = function () {
      var args = _.toArray(arguments);
      var methodName = args.shift();

      if (!_.isString(methodName)) {
        // .action(function (target) { return target.clickAt(0); })
        return action.apply(this, arguments);
      }

      // .action('clickAt', 0)
      return action.call(automator, function (target) {
        return target[methodName].apply(target, args);
      });
    };

    return wrapper;
  };

  // Use named action.
  // ex: .clickAt(0)
  var appendFunctionAction = function (automator) {
    var page = automator.getPage();

    var pageProxy =_.chain(page)
      .functions()
      .map(function (name) {
        return [
          name,
          function () {
            var args = _.toArray(arguments);

            return this.action(function (target) {
              return target[name].apply(target, args);
            });
          }
        ];
      })
      .object()
      .value();

    return _.extend(pageProxy, {
      getPage: $.proxy(automator.getPage, automator),
      getPromise: $.proxy(automator.getPromise, automator),
      action: function () {
        return appendFunctionAction(automator.action.apply(automator, arguments));
      },
      scope: function () {
        return appendFunctionAction(automator.scope.apply(automator, arguments));
      },
      test: function () {
        return appendFunctionAction(automator.test.apply(automator, arguments));
      },
      done: function () {
        return automator.done.apply(automator, arguments);
      }
    });
  };

  var u = _.clone(_);
  u.mixin({
    appendNamedAction: appendNamedAction,
    appendFunctionAction: appendFunctionAction
  });

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
      return u.chain(wrapAutomator(page))
        .appendNamedAction()
        .appendFunctionAction()
        .value();
    }
  };
})(jQuery || $, _);
