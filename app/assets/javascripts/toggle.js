$(document).ready(function () {
    $('.debug').hide()

    //gets the current time. 
    var d = new Date();
    if (d.getHours() >= 7 && d.getHours() <= 21) {
        $("#digital_assistant").show();
    }
    else {
        $("#digital_assistant").hide();
    }

    $(document).keypress(function (event) {
        // alert('Handler for .keypress() called. - ' + event.charCode);
        if (event.charCode == 93) {
            $('.debug').hide()
        }
        if (event.charCode == 91) {
            $('.debug').show()
        }
    })

    $('div#context-selector').scrollTop(300)

    $('.hide').click(function (event) {
        $(this)
            .parent()
            .hide()
    })

    $('.change_date').click(function (event) {
        if ($('#date_switcher').css('display') != 'none') {
            $('#date_switcher').hide()
        } else {
            $('#date_switcher').show()
        }
        event.preventDefault()
    })

    $('.cookie_accept_all').click(function (event) {
        document.cookie =
            'cookies_preferences_set=true; expires=Thu, 18 Dec 2023 12:00:00 UTC; path=/'
        $('#cookies_consent_mechanism').hide()
        $('#cookies_accepted').show()
        $('#cookies_rejected').hide()
        event.preventDefault()
    })

    $('.cookie_reject_all').click(function (event) {
        document.cookie =
            'cookies_preferences_set=true; expires=Thu, 18 Dec 2023 12:00:00 UTC; path=/'
        $('#cookies_consent_mechanism').hide()
        $('#cookies_accepted').hide()
        $('#cookies_rejected').show()
        event.preventDefault()
    })

    $('.hide_cookie_panel').click(function (event) {
        $('.app-cookie-banner').hide()
        event.preventDefault()
    })

    $('.cookies_save_changes').click(function (event) {
        $('#cookie-settings__confirmation').show()
        window.scrollTo(0, 0)
        event.preventDefault()
    })

    $('#commodity_tabs ul li a').click(function (event) {
        my_id = $(this).attr('id')
        my_id = my_id.replace('tab_', '')
        document.cookie = 'tab=' + my_id + '; path=/'
    })

    function onCreated(node) {
        console.log(node)
    }

    $("#bkme").click(function () {
        if (window.sidebar) { // Mozilla Firefox Bookmark
            window.sidebar.addPanel(location.href, document.title, "");
        } else if (window.external) { // IE Favorite
            window.external.AddFavorite(location.href, document.title);
        }
        else if (window.opera && window.print) { // Opera Hotlist
            this.title = document.title;
            return true;
        }
    });
})
