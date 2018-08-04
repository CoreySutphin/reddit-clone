/*
  Code to track upvotes and downvotes
*/

var xhttp = new XMLHttpRequest();

function Track(elem) {

  this.trackUpvote = function(target) {
    var id = target.getAttribute('data-id');
    var user = target.getAttribute('data-user');
    console.log(id, user);
    target.style.backgroundColor = 'orange';
    let downvotes = document.getElementsByClassName('arrow-down');
    Array.prototype.forEach.call(downvotes, function(downvote) {
      if (downvote.attributes['data-id'].value === id) {
        downvote.style.backgroundColor = '';
      }
    });

    xhttp.open('POST', '/r/vote/post', true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send('id=' + id + '&user=' + user + '&direction=' + 1);
  }

  this.trackDownvote =  function(target) {
    var id = target.getAttribute('data-id');
    var user = target.getAttribute('data-user');
    console.log(id, user)
    target.style.backgroundColor = 'blue';
    let upvotes = document.getElementsByClassName('arrow-up');
    Array.prototype.forEach.call(upvotes, function(upvote) {
      if (upvote.attributes['data-id'].value === id) {
        upvote.style.backgroundColor = '';
      }
    });

    xhttp.open('POST', '/r/vote/post', true)
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send('id=' + id + '&user=' + user + '&direction=' + '-1');
  }

  var self = this;

  elem.onclick = function(e) {
    var target = e && e.target || event.srcElement;
    var action = target.getAttribute('data-action');
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
