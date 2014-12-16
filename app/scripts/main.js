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
    clickLaunchDemoModal: function () {
      this.click('#launch-demo-modal');
      return this.switchModal();
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
      .done(function () { console.log('DONE'); });
  });

  $(document).on('show.bs.modal shown.bs.modal hide.bs.modal hidden.bs.modal', function (e) {
    console.log(e.type);
  });
})();
