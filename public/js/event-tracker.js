/*
  Code to track upvotes and downvotes
*/

var xhttp = new XMLHttpRequest();

function Track(elem) {

  this.trackUpvote = function(target) {
    var id = target.getAttribute('data-id');

    $(target).removeClass('arrow-up');
    $(target).addClass('arrow-up-voted');

    // Sets the corresponding downvote arrow to unclicked
    let downvotes = document.getElementsByClassName('arrow-down-voted');
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

    xhttp.open('POST', '/post/vote', true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send('id=' + id + '&direction=' + 1);
  }

  this.trackDownvote =  function(target) {
    var id = target.getAttribute('data-id');

    $(target).removeClass('arrow-down');
    $(target).addClass('arrow-down-voted');

    // Sets the corresponding upvote arrow to unclicked
    let upvotes = document.getElementsByClassName('arrow-up-voted');
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

    xhttp.open('POST', '/post/vote', true)
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send('id=' + id + '&direction=' + '-1');
  }

  var self = this;

  elem.onclick = function(e) {
    var target = e && e.target || event.srcElement;
    var action = target.getAttribute('data-action');
    if ($(target).hasClass('arrow-up-voted') || $(target).hasClass('arrow-down-voted')
      || !$(target).hasClass('login-required')) {
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

  let upvotes = document.getElementsByClassName('arrow-up');
  Array.prototype.forEach.call(upvotes, function(upvote) {
    new Track(upvote);
  });

  let downvotes = document.getElementsByClassName('arrow-down');
  Array.prototype.forEach.call(downvotes, function(downvote) {
    new Track(downvote);
  });

});
