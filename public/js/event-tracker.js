/*
  Code to track upvotes and downvotes
*/

var xhttp = new XMLHttpRequest();

function Track(elem) {

  this.trackUpvote = function(target) {
    var id = target.getAttribute('data-id');
    var user = target.getAttribute('data-user');

    $(target).removeClass('arrow-up');
    $(target).addClass('arrow-up-voted');
    // Sets the corresponding downvote arrow to unclicked
    let downvotes = document.getElementsByClassName('arrow-down-voted');
    Array.prototype.forEach.call(downvotes, function(downvote) {
      if (downvote.attributes['data-id'].value === id) {
        $(downvote).removeClass('arrow-down-voted');
        $(downvote).addClass('arrow-down')
        new Track(downvote);
      }
    });

    /*
     Increments the score for the post with the same post id
    */
    let scores = document.getElementsByClassName('score');
    Array.prototype.forEach.call(scores, function(score) {
      if (score.previousSibling.getAttribute('data-id') === id) {
        score.innerHTML = parseInt(score.innerHTML) + 1
      }
    });

    xhttp.open('POST', '/post/vote', true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send('id=' + id + '&user=' + user + '&direction=' + 1);
  }

  this.trackDownvote =  function(target) {
    var id = target.getAttribute('data-id');
    var user = target.getAttribute('data-user');

    $(target).removeClass('arrow-down');
    $(target).addClass('arrow-down-voted');
    // Sets the corresponding upvote arrow to unclicked
    let upvotes = document.getElementsByClassName('arrow-up-voted');
    Array.prototype.forEach.call(upvotes, function(upvote) {
      if (upvote.attributes['data-id'].value === id) {
        $(upvote).removeClass('arrow-up-voted');
        $(upvote).addClass('arrow-up')
        new Track(upvote);
      }
    });

    /*
      Decrements the score for the post with the same post id
    */
    let scores = document.getElementsByClassName('score');
    Array.prototype.forEach.call(scores, function(score) {
      if (score.nextSibling.getAttribute('data-id') === id) {
        score.innerHTML = parseInt(score.innerHTML) - 1
      }
    });

    xhttp.open('POST', '/post/vote', true)
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send('id=' + id + '&user=' + user + '&direction=' + '-1');
  }

  var self = this;

  elem.onclick = function(e) {
    var target = e && e.target || event.srcElement;
    var action = target.getAttribute('data-action');
    if ($(target).hasClass('arrow-up-voted') || $(target).hasClass('arrow-down-voted')) {
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
  let upvotes = document.getElementsByClassName('arrow-up');
  Array.prototype.forEach.call(upvotes, function(upvote) {
    new Track(upvote);
  });

  let downvotes = document.getElementsByClassName('arrow-down');
  Array.prototype.forEach.call(downvotes, function(downvote) {
    new Track(downvote);
  });

});
