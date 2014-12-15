var Testmator = (function ($, _) { // jshint ignore:line
  'use strict';

  // Helper function inheritance, like Backbone's extend.
  var extend = function (prototypePropeties, staticProperties) {
    var parent = this;
    var child;

    child = function () { return parent.apply(parent, arguments); };

    // Extend static properties.
    if (staticProperties) {
      _.extend(child, parent, staticProperties);
    }

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
          this.initialize(options);
        }
      };

      _.extend(PageObject.prototype, {
        $: function () {
          return this.$el.find.apply(this.$el, arguments);
        },
        click: function (selector) {
          this.$(selector).click(PageObject.clickEventName);
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
    })()
  };
})(jQuery || $, _);
