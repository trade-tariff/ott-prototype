$(function () {
    $("#copy_comm_code").click(function (event) {
        copyToClipboard("4103900000");

        $(".copied").css("text-indent", "0");
        $(".copied").delay(500).fadeOut(750, function() {
            $(".copied").css("text-indent", "-999em");
            $(".copied").css("display", "block");
        });
        event.preventDefault();
    });

    function copyToClipboard(text) {
        var $temp = $("<input>");
        $("body").append($temp);
        $temp.val(text).select();
        document.execCommand("copy");
        $temp.remove();
    }

});