function createExpander(container) {
    var containerTag = container.tagName;
    if (containerTag == "DETAILS") {
      if (
        (0, _isDetailsSupported.isDetailsSupported)() &&
        !(0, _isIOS2.default)()
      ) {
        return html5Version(container);
      } else {
        return html4Version(container);
      }
    } else {
      return html4Version(container);
    }
  }

  function html5Version(container) {
    var summary = container.querySelector(".deque-expander-summary");
    if (summary.hasAttribute("aria-expanded")) {
      return false;
    }

    summary.setAttribute("tabindex", "0");
    summary.setAttribute("aria-expanded", "false");

    container.classList.add("deque-expander");
    if (container.hasAttribute("open")) {
      summary.setAttribute("aria-expanded", "true");
      container.setAttribute("open");
    } else {
      summary.setAttribute("aria-expanded", "false");
      container.removeAttribute("open");
    }

    // it would seem that browsers treat the <summary>
    // element as if it were a button, i.e. automagically
    // treat space and enter as 'click' events.
    summary.setAttribute("role", "button");
    summary.setAttribute("aria-expanded", "false");

    function setOpenStatus() {
      if (container.hasAttribute("open")) {
        summary.setAttribute("aria-expanded", "true");
      } else {
        summary.setAttribute("aria-expanded", "false");
      }
    }

    summary.addEventListener("click", function () {
      setTimeout(setOpenStatus);
    });
  }

  function html4Version(container) {
    var containerTag = container.tagName;
    var summary = container.querySelector(".deque-expander-summary");
    if (summary.hasAttribute("aria-expanded")) {
      return false;
    }

    if (containerTag == "DETAILS") {
      /* convert summary element to div */
      var newSummary = document.createElement("div");
      var summaryNodes = [],
        summaryValues = []; //collects the names and values of the summary attributes into two arrays
      for (
        var att, i = 0, atts = summary.attributes, n = atts.length;
        i < n;
        i++
      ) {
        att = atts[i];
        summaryNodes.push(att.nodeName);
        summaryValues.push(att.nodeValue);
      }
      for (var x = 0; x < summaryNodes.length; x++) {
        newSummary.setAttribute(summaryNodes[x], summaryValues[x]); //puts the summary attributes onto the newly created div
      }
      newSummary.classList.add("deque-expander-summary");
      newSummary.innerHTML = summary.innerHTML;
      summary.parentNode.replaceChild(newSummary, summary);

      /* convert details element to div */
      var newContainer = document.createElement("div");
      var detailsNodes = [],
        detailsValues = []; //collects the names and values of the details attributes into two arrays
      for (
        var attContainer,
          j = 0,
          attsContainer = container.attributes,
          m = attsContainer.length;
        j < m;
        j++
      ) {
        attContainer = attsContainer[j];
        detailsNodes.push(attContainer.nodeName);
        detailsValues.push(attContainer.nodeValue);
      }
      for (var y = 0; y < detailsNodes.length; y++) {
        newContainer.setAttribute(detailsNodes[y], detailsValues[y]); //puts the details attributes onto the newly created div
      }
      newContainer.classList.add("deque-expander");
      newContainer.innerHTML = container.innerHTML;
      container.parentNode.replaceChild(newContainer, container);
      container = newContainer;
      summary = container.querySelector(".deque-expander-summary");
    }
    summary.setAttribute("tabindex", "0");
    summary.setAttribute("aria-expanded", "false");
    summary.setAttribute("role", "button");

    var content = container.querySelector(".deque-expander-content");
    content.classList.add("deque-hidden");

    function toggle(e) {
      var ua = window.navigator.userAgent;
      var msie = ua.indexOf("Trident/");
      var msedge = ua.indexOf("Edge");
      if (msie > 0 || msedge > 0) {
        window.onkeydown = function (e) {
          return !(e.keyCode == 32);
        };
      }

      e.stopPropagation();
      e.preventDefault();
      content.classList.toggle("deque-hidden");
      if (content.classList.contains("deque-hidden")) {
        summary.setAttribute("aria-expanded", "false");
      } else {
        summary.setAttribute("aria-expanded", "true");
      }
    }

    (0, _keyboardUtils.onElementEnter)(summary, toggle);
    (0, _keyboardUtils.onElementSpace)(summary, toggle);
    summary.addEventListener("click", toggle);
    summary.addEventListener("keyup", function (e) {
      if (e.keyCode == 32) {
        //toggle(e);
      }
    });
  }

  function activateAllExpanders() {
    var expanders = document.querySelectorAll(".deque-expander");
    for (var i = 0; i < expanders.length; i++) {
      if (expanders[i]) {
        if (expanders[i].querySelector("summary")) {
          if (
            !expanders[i]
              .querySelector("summary")
              .hasAttribute("aria-expanded")
          ) {
            createExpander(expanders[i]);
          }
        }

        if (expanders[i].querySelector(".deque-expander-summary")) {
          if (
            !expanders[i]
              .querySelector(".deque-expander-summary")
              .hasAttribute("aria-expanded")
          ) {
            createExpander(expanders[i]);
          }
        }

        /*
    if(!(expanders[i].querySelector('summary').hasAttribute('aria-expanded')) || !(expanders[i].querySelector('.deque-expander-summary').hasAttribute('aria-expanded'))) {
      console.log('iam in in');
      createExpander(expanders[i]);
    }
    */
      }
    }
  }

  activateAllExpanders();
