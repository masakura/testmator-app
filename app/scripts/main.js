(function () {
  'use strict';

  var ModalPage = Testmator.PageObject.extend({
    clickCloseDemoModal: function () {
      this.click('#close-demo-modal');
      return this.switchParent();
    },
    isShown: function () {
      return this.$el.hasClass('in');
    }
  });

  var AccordionPage = Testmator.PageObject.extend({
    names: {
      1: 'collapseOne',
      2: 'collapseTwo',
      3: 'collapseThree'
    },
    clickAt: function (number) {
      this.click('[data-toggle="collapse"][href="#' + this.names[number] + '"]');
      return this;
    },
    isShownAt: function (number) {
      return this.$('#' + this.names[number]).hasClass('in');
    }
  });

  var AlertPage = Testmator.PageObject.extend({
    clickClose: function () {
      this.click('#close-alert');
      return this.switchParent();
    }
  });

  var AppPage = Testmator.PageObject.extend({
    switchModal: function () {
      return new ModalPage({
        el: this.$('#myModal'),
        parent: this
      });
    },
    switchAccordion: function () {
      return new AccordionPage({
        el: this.$('#accordion'),
        parent: this
      });
    },
    switchAlert: function () {
      return new AlertPage({
        el: this.$('#alert'),
        parent: this
      });
    },
    clickLaunchDemoModal: function () {
      this.click('#launch-demo-modal');
      return this.switchModal();
    },
    clickThrowError: function () {
      this.click('#throw-error');
      return this.switchAlert();
    }
  });

  var app = new AppPage();

  $(document).on('click', '#test1', function () {
    Testmator.wrap(app)
      .test(function (app) {
        console.log(!app.switchModal().isShown());
      })
      .action('clickLaunchDemoModal')
      .scope(function (dialog) {
        return Testmator.wrap(dialog)
          .test(function () {
            console.log(dialog.isShown());
          })
          .clickCloseDemoModal();
      })
      .test(function (app) {
        console.log(!app.switchModal().isShown());
      })
      .action(function (app) {
        return app.switchAccordion();
      })
      .scope(function (accordion) {
        return Testmator.wrap(accordion)
          .test(function () {
            console.log(accordion.isShownAt(1));
            console.log(!accordion.isShownAt(2));
            console.log(!accordion.isShownAt(3));
          })
          .clickAt(1)
          .test(function () {
            console.log(!accordion.isShownAt(1));
            console.log(!accordion.isShownAt(2));
            console.log(!accordion.isShownAt(3));
          })
          .clickAt(2)
          .test(function () {
            console.log(!accordion.isShownAt(1));
            console.log(accordion.isShownAt(2));
            console.log(!accordion.isShownAt(3));
          })
          .clickAt(1)
          .test(function () {
            console.log(accordion.isShownAt(1));
            console.log(!accordion.isShownAt(2));
            console.log(!accordion.isShownAt(3));
          })
          .switchParent();
      })
      .action('clickThrowError')
      .scope(function (alert) {
        return Testmator.wrap(alert)
          .clickClose();
      })
      .done(function () { console.log('DONE'); });
  });

  $(document).on('click', '#throw-error', function () {
    var template = _.template($('#alert-template').html());
    $('#page').append(template());
  });
})();
