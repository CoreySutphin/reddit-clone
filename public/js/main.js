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

  $('.delete-subreddit').on('click', function(e) {
    $target = $(e.target);
    const id = $target.attr('data-id');
    var result = confirm('Are you sure you want to delete this subreddit?');
    if(result) {
      $.ajax({
        type: 'DELETE',
        url: '/admin/delete_sub/' + id,
        success: function(res) {
          alert('Deleted subreddit');
          window.location.href='/admin/subreddits';
        },
        error: function(err){
          console.log(err);
        }
      });
    } else {
      console.log('Failure');
    }
  });

  $('.delete-post').on('click', function(e) {
    $target = $(e.target);
    const id = $target.attr('data-id');
    var result = confirm('Are you sure you want to delete this post?');
    if(result) {
      $.ajax({
        type: 'DELETE',
        url: '/admin/delete_post/' + id,
        success: function(res) {
          alert('Deleted post.');
          window.location.href='/admin/posts';
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
