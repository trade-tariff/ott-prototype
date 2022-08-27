$(document).ready(function () {

    // Function to open and close the main menu's search function
    $("#super-search-menu-toggle").on("click", function () {
        if ($(".search_panel").is(":visible")) {
            $(".search_panel").hide();
            $(".gem-c-layout-super-navigation-header__navigation-top-toggle-close-icon").hide();
        } else {
            $(".search_panel").show();
            $(".gem-c-layout-super-navigation-header__navigation-top-toggle-close-icon").show();
            $("#search_term").focus();
        }
    });

    // Function to open and close search filter options
    $(".app-c-expander__button").on("click", function () {
        var state = $(this).attr("aria-expanded");
        var aria_controls = $(this).attr("aria-controls");

        if (state == "true") {
            // Contract the facet
            $(this).attr("aria-expanded", "false");
            $("#" + aria_controls).hide();
        } else {
            // Expand the facet
            $(this).attr("aria-expanded", "true");
            $("#" + aria_controls).show();
        }
    });
});
