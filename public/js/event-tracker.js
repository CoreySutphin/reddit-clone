/*
  Code to track upvotes and downvotes
*/

var xhttp = new XMLHttpRequest();

function Track(elem) {

  this.trackUpvote = function(target) {
    var id = target.getAttribute('data-id');

    if ($(target).hasClass('arrow-up-voted')) {
      $(target).removeClass('arrow-up-voted');
      $(target).addClass('arrow-up');
      target.nextSibling.innerHTML = parseInt(target.nextSibling.innerHTML) - 1;
    }
    else {
      $(target).removeClass('arrow-up');
      $(target).addClass('arrow-up-voted');
      // Sets the corresponding downvote arrow to unclicked and increments score
      let downvotes = $('.arrow-down, .arrow-down-voted');
      Array.prototype.forEach.call(downvotes, function(downvote) {
        if (downvote.attributes['data-id'].value === id) {
          if ($(downvote).hasClass('arrow-down-voted')) {
            downvote.previousSibling.innerHTML = parseInt(downvote.previousSibling.innerHTML) + 1;
          }
          downvote.previousSibling.innerHTML = parseInt(downvote.previousSibling.innerHTML) + 1;
          $(downvote).removeClass('arrow-down-voted');
          $(downvote).addClass('arrow-down');
          new Track(downvote);
        }
      });
    }

    // Send request to server
    if ($(target).hasClass('comment')) {
      xhttp.open('POST', '/post/vote', true);
      xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      xhttp.send('id=' + id + '&direction=' + 1 + '&type=' + 'comment');
    }
    else {
      xhttp.open('POST', '/post/vote', true);
      xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      xhttp.send('id=' + id + '&direction=' + 1 + '&type=' + 'post');
    }
  }

  this.trackDownvote =  function(target) {
    var id = target.getAttribute('data-id');

    if ($(target).hasClass('arrow-down-voted')) {
      $(target).removeClass('arrow-down-voted');
      $(target).addClass('arrow-down');
      target.previousSibling.innerHTML = parseInt(target.previousSibling.innerHTML) + 1;
    }
    else {
      $(target).removeClass('arrow-down');
      $(target).addClass('arrow-down-voted');
      // Sets the corresponding upvote arrow to unclicked and decrements score
      let upvotes = $('.arrow-up, .arrow-up-voted');
      Array.prototype.forEach.call(upvotes, function(upvote) {
        if (upvote.attributes['data-id'].value === id) {
          if ($(upvote).hasClass('arrow-up-voted')) {
            upvote.nextSibling.innerHTML = parseInt(upvote.nextSibling.innerHTML) - 1;
          }
          upvote.nextSibling.innerHTML = parseInt(upvote.nextSibling.innerHTML) - 1;
          $(upvote).removeClass('arrow-up-voted');
          $(upvote).addClass('arrow-up');
          new Track(upvote);
        }
      });
    }

    // Send request to server
    if ($(target).hasClass('comment')) {
      xhttp.open('POST', '/post/vote', true);
      xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      xhttp.send('id=' + id + '&direction=' + '-1' + '&type=' + 'comment');
    }
    else {
      xhttp.open('POST', '/post/vote', true);
      xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      xhttp.send('id=' + id + '&direction=' + '-1' + '&type=' + 'post');
    }
  }

  var self = this;

  elem.onclick = function(e) {
    var target = e && e.target || event.srcElement;
    var action = target.getAttribute('data-action');
    if (!$(target).hasClass('login-required')) {
      return;
    }
    if (action === 'upvote') {
      self.trackUpvote(target);
    }
    else if (action === 'downvote') {
      self.trackDownvote(target);
    }
  }
}

// Called when body is rendered
$(document).ready(function() {
  $('.login-required').click(function(event) {
    if (!window.user) {
      event.stopImmediatePropagation();
      var alert = window.alert('You need to login to do this');
    }
  });

  let upvotes = $('.arrow-up, .arrow-up-voted');
  Array.prototype.forEach.call(upvotes, function(upvote) {
    new Track(upvote);
  });

  let downvotes = $('.arrow-down, .arrow-down-voted');
  Array.prototype.forEach.call(downvotes, function(downvote) {
    new Track(downvote);
  });

});
