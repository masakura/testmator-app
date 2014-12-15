(function () {
  'use strict';

  var AppPage = Testmator.PageObject.extend({});

  console.log((new AppPage()) instanceof Testmator.PageObject);
})();
