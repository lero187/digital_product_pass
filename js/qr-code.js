/*
==================================================
ÖFFENTLICHE DPP-ADRESSE
==================================================
*/

const PUBLIC_DPP_BASE_URL =
    "https://lero187.github.io/digital_product_pass/product.html";


/*
==================================================
QR-CODE ERZEUGEN
==================================================
*/

function generateDppQrCode(dpp) {

    const qrContainer =
        document.getElementById(
            "qrCode"
        );


    const qrStatus =
        document.getElementById(
            "qrCodeStatus"
        );


    const publicLink =
        document.getElementById(
            "dppPublicLink"
        );


    if (!qrContainer) {
        return;
    }


    /*
    Alten QR-Code entfernen
    */

    qrContainer.innerHTML = "";


    /*
    Öffentliche DPP-URL erzeugen
    */

    const dppUrl =
        `${PUBLIC_DPP_BASE_URL}?id=${encodeURIComponent(dpp.dppId)}`;


    /*
    QR-Code erzeugen
    */

    new QRCode(
        qrContainer,
        {
            text:
                dppUrl,

            width:
                256,

            height:
                256,

            correctLevel:
                QRCode.CorrectLevel.H
        }
    );


    /*
    Link anzeigen
    */

    if (publicLink) {

        publicLink.href =
            dppUrl;

        publicLink.textContent =
            dppUrl;
    }


    /*
    Status anzeigen
    */

    if (qrStatus) {

        qrStatus.innerHTML = `
            <p>
                <strong>
                    ✓ QR-Code wurde erzeugt.
                </strong>
            </p>

            <p>
                Der QR-Code führt direkt zu
                diesem Digital Product Passport.
            </p>
        `;
    }


    console.log(
        "DPP QR-Code erzeugt:",
        dppUrl
    );
}