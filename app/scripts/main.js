(function () {
  'use strict';

  $(document).on('click', '#throw-error', function () {
    var template = _.template($('#alert-template').html());
    $('#page').append(template());
  });
})();
