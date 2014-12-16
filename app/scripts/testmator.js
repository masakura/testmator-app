var Testmator = (function ($, _) { // jshint ignore:line
  'use strict';

  (function () {
    var monitor = {
      level_: 0,
      callbacks: [],
      start: function () {
        this.level_++;
      },
      end: function () {
        if (this.level_ <= 0) {
          return;
        }

        this.level_--;

        if (this.level_ <= 0) {
          this.executeAll_();
        }
      },
      register: function (callback) {
        this.callbacks.push(callback);

        if (this.level_ <= 0) {
          this.executeAll_();
        }
      },
      executeAll_: function () {
        var callbacks = this.callbacks;
        this.callbacks = [];

        setTimeout(function () {
          callbacks.forEach(function (callback) {
            callback();
          });
        }, 11);
      }
    };

    var eventNames = ['show', 'shown', 'hide', 'hidden'];
    var types = ['bs.modal', 'bs.collapse'];
    var events = _.chain(eventNames)
      .map(function (name) {
        return _.map(types, function (type) { return name + '.' + type; });
      })
      .flatten()
      .join(' ')
      .value();

    $(document).on(events, function (e) {
      if (e.type === 'hide' || e.type === 'show') {
        monitor.start();
      } else if (e.type === 'hidden' || e.type === 'shown') {
        monitor.end();
      }
    });

    $.fn.promiseTransition = function () {
      var deferred = $.Deferred();
      var args = _.toArray(arguments);

      monitor.register(function () {
        deferred.resolve.apply(deferred, args);
      });

      return deferred.promise();
    };
  })();

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

  var createWrappedAutomator = function (automator, wrap) {
    var throughs = ['getPage', 'getPromise', 'done'];

    var through = _.chain(throughs)
      .map(function (name) {
        return [
          name,
          $.proxy(automator[name], automator)
        ];
      })
      .object()
      .value();

    var wrapper = _.chain(automator)
      .functions()
      .difference(throughs)
      .map(function (name) {
        return [
          name,
          function () {
            return wrap(automator[name].apply(automator, arguments));
          }
        ];
      })
      .object()
      .value();

    return _.extend({}, through, wrapper);
  };

  // Use named action.
  // ex: .action('clickAt', 0)
  var appendNamedAction = function (automator) {
    var wrapper = createWrappedAutomator(automator, appendNamedAction);
    var action = wrapper.action;

    _.extend(wrapper, {
      name: 'NAMED',
      action:  function () {
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
      }
    });

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

    return _.extend(pageProxy,
                    createWrappedAutomator(automator, appendFunctionAction), {
                      name: 'FUNCTION'
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
