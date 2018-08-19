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
    if( $('#'+ 'edit' +id).css('display') == 'none') {
      $('#'+ 'edit' +id).css('display', 'block');
    } else {
      $('#'+ 'edit' +id).css('display', 'none');
    }
  });

  //Sets the margins for the nested comments
  $('.commentContainer').each(function() {
    $(this).css('margin-left', 10 + 15 * $(this).attr('data-depth'));
  });

  $('.deleteComment').on('click', function(e) {
    $target = $(e.target);
    const id = $target.attr('data-id');
    var result = confirm('Are you sure you want to delete this user?');
    if(result) {
      $.ajax({
        type: 'POST',
        url: '/post/deleteComment/' + id,
        success: function(res) {
          alert('Deleted comment');
          window.location.reload();
        },
        error: function(err){
          console.log(err);
        }
      });
    } else {
      console.log('Failure');
    }
  });
});
