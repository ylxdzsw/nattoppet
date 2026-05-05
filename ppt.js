// events: click, delay, sim
// time-for-delay: short, long
// fx: slide, fade, fx-[color]
// time-for-fx: fast, slow
var init;

init = function() {
  var clickListener, current, enter, fx, inview, scens, timeline, update;
  scens = [].slice.call(document.querySelectorAll('.scen'));
  current = scens[0];
  timeline = 0;
  clickListener = function() {};
  enter = function(x) {
    x.classList.add('active');
    return fx(++timeline, [].slice.call(x.querySelectorAll('.click, .delay, .sim')));
  };
  inview = function(x) {
    var height, ref, top;
    ({top, height} = x.getBoundingClientRect());
    return (top <= (ref = innerHeight / 2) && ref <= top + height);
  };
  update = function() {
    var e, i, j, len, len1, ref, results, x;
    if (!inview(current)) {
      results = [];
      for (i = 0, len = scens.length; i < len; i++) {
        x = scens[i];
        if (inview(x)) {
          ref = document.querySelectorAll('.active');
          for (j = 0, len1 = ref.length; j < len1; j++) {
            e = ref[j];
            e.classList.remove('active');
          }
          enter(x);
          current = x;
          break;
        } else {
          results.push(void 0);
        }
      }
      return results;
    }
  };
  fx = function(t, [head, ...tail]) {
    var cb;
    if (head == null) {
      return;
    }
    cb = function() {
      if (t !== timeline) {
        return;
      }
      head.classList.add('active');
      return fx(t, tail);
    };
    if (head.classList.contains('click')) {
      return clickListener = cb;
    } else if (head.classList.contains('delay')) {
      if (head.classList.contains('long')) {
        return setTimeout(cb, 800);
      } else if (head.classList.contains('short')) {
        return setTimeout(cb, 200);
      } else {
        return setTimeout(cb, 400);
      }
    } else if (head.classList.contains('sim')) {
      return cb();
    }
  };
  enter(current);
  addEventListener('click', function() {
    return clickListener();
  });
  addEventListener('scroll', update);
  addEventListener('resize', update);
  return setInterval(update, 2000);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
