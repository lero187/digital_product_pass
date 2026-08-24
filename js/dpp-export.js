/*
==================================================
DPP JSON EXPORT
==================================================
*/

function exportCurrentDpp() {

    const storedDpp =
        localStorage.getItem(
            "currentDpp"
        );


    if (!storedDpp) {

        alert(
            "Es wurde noch kein DPP erzeugt."
        );

        return;
    }


    let dpp;


    try {

        dpp =
            JSON.parse(
                storedDpp
            );

    } catch (error) {

        console.error(
            "DPP konnte nicht gelesen werden:",
            error
        );


        alert(
            "Der gespeicherte DPP konnte nicht gelesen werden."
        );

        return;
    }


    const json =
        JSON.stringify(
            dpp,
            null,
            2
        );


    const blob =
        new Blob(
            [json],
            {
                type:
                    "application/json"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        `${dpp.dppId}.json`;


    document.body.appendChild(
        link
    );


    link.click();


    document.body.removeChild(
        link
    );


    URL.revokeObjectURL(
        url
    );
}


/*
==================================================
BUTTON
==================================================
*/

const exportDppButton =
    document.getElementById(
        "exportDppButton"
    );


if (exportDppButton) {

    exportDppButton.addEventListener(
        "click",
        exportCurrentDpp
    );
}