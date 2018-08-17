$(document).ready(function() {
  //Clicking on the reply button for a comment hides or shows the reply box
  $('.commentReply').on('click', function(e) {
    $target = $(e.target);
    const id = $target.attr('data-id');
    if( $('#'+id).css('display') == 'none') {
      $('#'+id).css('display', 'block');
    } else {
      $('#' + id).css('display', 'none');
    }
  });

  $('.editButton').on('click', function(e) {
    $target = $(e.target);
    const id = $target.attr('data-id');
    if( $('#'+id).css('display') == 'none') {
      $('#'+id).css('display', 'block');
    } else {
      $('#' + id).css('display', 'none');
    }
  });

  //Sets the margins for the nested comments
  $('.commentContainer').each(function() {
    $(this).css('margin-left', 10 + 15 * $(this).attr('data-depth'));
  });
});
