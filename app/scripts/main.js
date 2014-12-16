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

  var AppPage = Testmator.PageObject.extend({
    switchModal: function () {
      return new ModalPage({
        el: this.$('#myModal'),
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
        console.log(app.switchModal().isShown());
      })
      .action(function (app) {
        var dialog = app.clickLaunchDemoModal();
        return $(document).promiseTransition(dialog);
      })
      .scope(function (dialog) {
        return Testmator.wrap(dialog)
          .test(function () {
            console.log(dialog.isShown());
          })
          .clickCloseDemoModal()
          .scope(function (app) {
            return $(document).promiseTransition(app);
          });
      })
      .test(function (app) {
        console.log(!app.switchModal().isShown());
      })
      .done(function () { console.log('DONE'); });
  });

  $(document).on('show.bs.modal shown.bs.modal hide.bs.modal hidden.bs.modal', function (e) {
    console.log(e.type);
  });
})();
