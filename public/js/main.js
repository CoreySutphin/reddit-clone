$(document).ready(function() {
  $('.delete-user').on('click', function(e) {
    $target = $(e.target);
    const id = $target.attr('data-id');
    var result = confirm('Are you sure you want to delete this user?');
    if(result) {
      $.ajax({
        type: 'DELETE',
        url: '/admin/delete_user/' + id,
        success: function(res) {
          alert('Deleted user');
          window.location.href='/admin/users';
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
