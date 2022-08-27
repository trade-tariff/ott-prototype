$(document).ready(function () {
    $("details").on("click", function () {
        console.log($(this).attr("open"));
        open_state = $(this).attr("open");
        console.log(open_state);
        if (open_state == "open") {
            $(this).find(".heading-description").first().removeClass("heading-open");
        } else {
            $(this).find(".heading-description").first().addClass("heading-open");
        }
    });

    $(".headings_open").on("click", function () {
        $("details").attr("open", "true");
        $(this).find(".heading-description").first().addClass("heading-open");
    });

    $(".headings_close").on("click", function () {
        $("details").removeAttr("open");
        $(this).find(".heading-description").first().removeClass("heading-open");
    });
});