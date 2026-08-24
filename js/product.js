/*
==================================================
DIGITAL PRODUCT PASSPORT
KUNDENSEITE
==================================================
*/


/*
==================================================
HILFSFUNKTIONEN
==================================================
*/


function yesNo(value) {

    return value
        ? "Ja"
        : "Nein";
}



function getDppIdFromUrl() {

    const parameters =
        new URLSearchParams(
            window.location.search
        );


    return parameters.get(
        "id"
    );
}



function formatNumber(
    value,
    decimals = 2
) {

    const number =
        Number(value);


    if (
        !Number.isFinite(number)
    ) {

        return "-";
    }


    return number.toLocaleString(
        "de-DE",
        {
            maximumFractionDigits:
                decimals
        }
    );
}



/*
==================================================
DPP NORMALISIEREN
==================================================
*/


function normalizeDpp(value) {

    if (!value) {

        return null;
    }


    /*
    Supabase kann ein Array zurückgeben.
    */

    if (
        Array.isArray(value)
    ) {

        if (
            value.length === 0
        ) {

            return null;
        }


        return normalizeDpp(
            value[0]
        );
    }


    /*
    Falls JSON als String gespeichert wurde.
    */

    if (
        typeof value ===
        "string"
    ) {

        try {

            return normalizeDpp(
                JSON.parse(value)
            );

        } catch (error) {

            return null;
        }
    }


    /*
    Bereits vollständiger DPP.
    */

    if (
        value.dppId &&
        value.identification
    ) {

        return value;
    }


    /*
    Mögliche Supabase JSON-Spalten.
    */

    const possibleFields = [

        "dpp_data",
        "dppData",
        "data",
        "dpp",
        "passport",
        "payload",
        "json"

    ];


    for (
        const field
        of possibleFields
    ) {

        if (
            value[field]
        ) {

            const normalized =
                normalizeDpp(
                    value[field]
                );


            if (normalized) {

                return normalized;
            }
        }
    }


    return null;
}



/*
==================================================
DPP AUS SUPABASE LADEN
==================================================
*/


async function loadDppFromSupabase(
    dppId
) {

    /*
    Zuerst vorhandene Funktion
    aus supabase-dpp.js verwenden.
    */

    if (
        typeof loadDppOnline ===
        "function"
    ) {

        try {

            const onlineDpp =
                await loadDppOnline(
                    dppId
                );


            const normalized =
                normalizeDpp(
                    onlineDpp
                );


            if (normalized) {

                return normalized;
            }

        } catch (error) {

            console.warn(
                "loadDppOnline fehlgeschlagen:",
                error
            );
        }
    }


    /*
    Direkter REST-Fallback.
    */

    if (
        typeof SUPABASE_DPP_ENDPOINT ===
        "undefined" ||
        typeof SUPABASE_PUBLISHABLE_KEY ===
        "undefined"
    ) {

        return null;
    }


    try {

        const url =
            `${SUPABASE_DPP_ENDPOINT}` +
            `?dpp_id=eq.${encodeURIComponent(dppId)}` +
            `&select=*`;


        const response =
            await fetch(
                url,
                {
                    headers: {

                        "apikey":
                            SUPABASE_PUBLISHABLE_KEY,

                        "Authorization":
                            `Bearer ${SUPABASE_PUBLISHABLE_KEY}`

                    }
                }
            );


        if (
            !response.ok
        ) {

            return null;
        }


        const result =
            await response.json();


        return normalizeDpp(
            result
        );

    } catch (error) {

        console.warn(
            "Supabase-DPP konnte nicht geladen werden:",
            error
        );


        return null;
    }
}



/*
==================================================
DPP LADEN
==================================================
*/


async function loadDpp() {

    const dppId =
        getDppIdFromUrl();


    /*
    ==================================================
    1. EXAKTE DPP-ID
    ==================================================
    */

    if (dppId) {


        /*
        Supabase
        */

        const onlineDpp =
            await loadDppFromSupabase(
                dppId
            );


        if (onlineDpp) {

            console.log(
                "DPP aus Supabase geladen:",
                onlineDpp
            );


            return onlineDpp;
        }


        /*
        JSON-Datei
        */

        try {

            const response =
                await fetch(
                    `data/dpp/${encodeURIComponent(dppId)}.json`
                );


            if (
                response.ok
            ) {

                const jsonDpp =
                    await response.json();


                const normalized =
                    normalizeDpp(
                        jsonDpp
                    );


                if (normalized) {

                    return normalized;
                }
            }

        } catch (error) {

            /*
            Nur Fallback.
            */
        }


        /*
        localStorage
        */

        const storedDpp =
            localStorage.getItem(
                `dpp:${dppId}`
            );


        if (storedDpp) {

            return normalizeDpp(
                storedDpp
            );
        }
    }


    /*
    ==================================================
    2. LETZTEN LOKALEN DPP
    ==================================================
    */

    const currentDpp =
        localStorage.getItem(
            "currentDpp"
        );


    if (currentDpp) {

        return normalizeDpp(
            currentDpp
        );
    }


    return null;
}



/*
==================================================
PRODUKTÜBERSICHT
==================================================
*/


function renderProductOverview(
    dpp
) {

    const container =
        document.getElementById(
            "productOverview"
        );


    if (!container) {

        return;
    }


    const identification =
        dpp.identification;


    const product =
        dpp.product;


    const colorId =
        identification.color
            ? identification.color.id
            : "";


    const colorName =
        identification.color
            ? identification.color.name
            : "-";


    const productColors = {

        "light-blue":
            "#9fc7dc",

        "white":
            "#f4f4f1",

        "dark-blue":
            "#263f5f"

    };


    const shirtColor =
        productColors[colorId]
        || "#cbd3cf";


    const materialComposition =
        Array.isArray(
            dpp.materials
        )
            ? dpp.materials
                .map(
                    material => `
                        <span>
                            ${material.percentage} %
                            ${material.materialName}
                        </span>
                    `
                )
                .join("")
            : "";


    const materialType =
        dpp.materials &&
        dpp.materials.length > 1
            ? "Mischgewebe"
            : dpp.materials &&
              dpp.materials.length === 1
                ? dpp.materials[0]
                    .materialName
                : "-";


    container.innerHTML = `

        <div class="product-page">

            <div class="product-main">


                <div class="product-image-area">

                    <div class="product-image-label">
                        Produktansicht
                    </div>


                    <svg
                        class="shirt-image"
                        viewBox="0 0 400 480"
                        xmlns="http://www.w3.org/2000/svg"
                        role="img"
                        aria-label="${identification.productName}"
                    >

                        <ellipse
                            cx="200"
                            cy="440"
                            rx="110"
                            ry="14"
                            fill="rgba(0,0,0,0.08)"
                        />


                        <path
                            d="
                                M130 85
                                L80 105
                                L28 165
                                L74 205
                                L105 174
                                L105 415
                                Q105 430 122 430
                                H278
                                Q295 430 295 415
                                V174
                                L326 205
                                L372 165
                                L320 105
                                L270 85
                                C257 118 234 136 200 136
                                C166 136 143 118 130 85
                                Z
                            "
                            fill="${shirtColor}"
                            stroke="rgba(30,45,38,0.35)"
                            stroke-width="4"
                        />


                        <path
                            d="
                                M130 85
                                L168 64
                                H232
                                L270 85
                                L235 142
                                L200 116
                                L165 142
                                Z
                            "
                            fill="${shirtColor}"
                            stroke="rgba(30,45,38,0.35)"
                            stroke-width="4"
                        />


                        <line
                            x1="200"
                            y1="117"
                            x2="200"
                            y2="428"
                            stroke="rgba(30,45,38,0.28)"
                            stroke-width="3"
                        />


                        <g
                            fill="rgba(255,255,255,0.9)"
                            stroke="rgba(30,45,38,0.35)"
                        >

                            <circle cx="211" cy="159" r="4"/>
                            <circle cx="211" cy="197" r="4"/>
                            <circle cx="211" cy="235" r="4"/>
                            <circle cx="211" cy="273" r="4"/>
                            <circle cx="211" cy="311" r="4"/>
                            <circle cx="211" cy="349" r="4"/>
                            <circle cx="211" cy="387" r="4"/>

                        </g>

                    </svg>

                </div>



                <div class="product-details">

                    <div class="product-category">
                        ${identification.category}
                    </div>


                    <h1>
                        ${identification.productName}
                    </h1>


                    <p class="product-description">
                        ${identification.description || ""}
                    </p>


                    <div class="product-properties">


                        <div class="product-property">

                            <div class="property-label">
                                Farbe
                            </div>

                            <div class="property-value color-value">

                                <span
                                    class="color-circle"
                                    style="background:${shirtColor}"
                                ></span>

                                ${colorName}

                            </div>

                        </div>



                        <div class="product-property">

                            <div class="property-label">
                                Material
                            </div>

                            <div class="property-value">

                                <div class="material-type">
                                    ${materialType}
                                </div>

                                <div class="material-composition">
                                    ${materialComposition}
                                </div>

                            </div>

                        </div>



                        <div class="product-property">

                            <div class="property-label">
                                Größe
                            </div>

                            <div class="property-value">
                                ${identification.size.name}
                            </div>

                        </div>



                        <div class="product-property">

                            <div class="property-label">
                                Passform
                            </div>

                            <div class="property-value">
                                ${identification.fit.name}
                            </div>

                        </div>



                        <div class="product-property">

                            <div class="property-label">
                                Artikelnummer
                            </div>

                            <div class="property-value">
                                ${identification.sku}
                            </div>

                        </div>



                        <div class="product-property">

                            <div class="property-label">
                                Gewicht
                            </div>

                            <div class="property-value">
                                ${product.totalProductMassGrams} g
                            </div>

                        </div>


                    </div>

                </div>

            </div>

        </div>
    `;
}



/*
==================================================
ROHSTOFFE
==================================================
*/


function renderMaterials(
    dpp
) {

    const container =
        document.getElementById(
            "materials"
        );


    if (!container) {

        return;
    }


    container.innerHTML =
        "";


    if (
        !Array.isArray(
            dpp.materials
        ) ||
        dpp.materials.length === 0
    ) {

        container.textContent =
            "Keine Materialdaten verfügbar.";

        return;
    }


    dpp.materials.forEach(
        material => {

            const source =
                material.source;


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "material-card";


            card.innerHTML = `

                <div class="material-header">

                    <div>

                        <div class="material-percentage">
                            ${material.percentage} %
                        </div>

                        <h3>
                            ${material.materialName}
                        </h3>

                    </div>

                    <div class="material-mass">
                        ${formatNumber(material.massGrams, 1)} g
                    </div>

                </div>


                <div class="material-progress">

                    <span
                        style="
                            width:
                            ${material.percentage}%;
                        "
                    ></span>

                </div>


                ${
                    source
                        ? `

                            <div class="info-grid">

                                <div>

                                    <span>
                                        Herkunft
                                    </span>

                                    <strong>
                                        ${source.originRegion},
                                        ${source.originCountry}
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Lieferant
                                    </span>

                                    <strong>
                                        ${source.companyName || "-"}
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Standort
                                    </span>

                                    <strong>
                                        ${source.city || source.siteName || "-"}
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Recyclinganteil
                                    </span>

                                    <strong>
                                        ${source.recycledContentPercent} %
                                    </strong>

                                </div>

                            </div>

                        `
                        : `
                            <p>
                                Keine Herkunftsdaten verfügbar.
                            </p>
                        `
                }

            `;


            container.appendChild(
                card
            );

        }
    );
}



/*
==================================================
PRODUKTION
==================================================
*/


function getProductionCompany(
    step
) {

    if (
        step.assignment
    ) {

        return step.assignment.company;
    }


    return step.company;
}



function getProductionSite(
    step
) {

    if (
        step.assignment
    ) {

        return step.assignment.site;
    }


    return step.site;
}



function getProcessName(
    step
) {

    if (
        step.processType ===
        "sewing"
    ) {

        return "Nähen & Konfektion";
    }


    return step.processName;
}



function createProcessCard(
    step,
    number
) {

    const company =
        getProductionCompany(
            step
        );


    const site =
        getProductionSite(
            step
        );


    return `

        <div class="process-card">

            <div class="process-number">
                ${String(number).padStart(2, "0")}
            </div>


            <div class="process-content">

                ${
                    step.materialName
                        ? `
                            <div class="process-material">
                                ${step.materialName}
                            </div>
                        `
                        : ""
                }


                <h3>
                    ${getProcessName(step)}
                </h3>


                <div class="process-info-grid">


                    <div>

                        <span>
                            Unternehmen
                        </span>

                        <strong>
                            ${
                                company
                                    ? company.name
                                    : "-"
                            }
                        </strong>

                    </div>


                    <div>

                        <span>
                            Standort
                        </span>

                        <strong>
                            ${
                                site
                                    ? `${site.city} · ${site.country}`
                                    : "-"
                            }
                        </strong>

                    </div>


                </div>

            </div>

        </div>

    `;
}



function renderProcessPath(
    title,
    subtitle,
    steps
) {

    const stepHtml =
        steps
            .map(
                (step, index) => {

                    const card =
                        createProcessCard(
                            step,
                            index + 1
                        );


                    const arrow =
                        index <
                        steps.length - 1
                            ? `
                                <div class="process-arrow">
                                    ↓
                                </div>
                            `
                            : "";


                    return card + arrow;
                }
            )
            .join("");


    return `

        <div class="production-path">

            <div class="production-path-header">

                <span>
                    ${subtitle}
                </span>

                <h3>
                    ${title}
                </h3>

            </div>

            ${stepHtml}

        </div>

    `;
}



function renderProduction(
    dpp
) {

    const container =
        document.getElementById(
            "production"
        );


    if (!container) {

        return;
    }


    if (
        !Array.isArray(
            dpp.production
        ) ||
        dpp.production.length === 0
    ) {

        container.textContent =
            "Keine Produktionsdaten verfügbar.";

        return;
    }


    const cottonSteps =
        dpp.production.filter(
            step =>
                step.branch ===
                "cotton"
        );


    const polyesterSteps =
        dpp.production.filter(
            step =>
                step.branch ===
                "polyester"
        );


    const mainSteps =
        dpp.production.filter(
            step =>
                step.branch ===
                "main"
        );


    container.innerHTML = `

        <div class="production-branches">

            ${renderProcessPath(
                "Baumwolle",
                "Rohstoffpfad",
                cottonSteps
            )}

            ${renderProcessPath(
                "Polyester",
                "Rohstoffpfad",
                polyesterSteps
            )}

        </div>


        <div class="production-merge">

            <span>
                Baumwolle und Polyester werden
                zum Mischgewebe zusammengeführt
            </span>

            <strong>
                ↓
            </strong>

        </div>


        <div class="production-main">

            ${renderProcessPath(
                "Gemeinsame Weiterverarbeitung",
                "Mischgewebe",
                mainSteps
            )}

        </div>


        <div class="finished-product">

            <div class="finished-check">
                ✓
            </div>

            <div>

                <strong>
                    Fertiges Produkt
                </strong>

                <span>
                    ${dpp.identification.productName}
                </span>

            </div>

        </div>

    `;
}



/*
==================================================
TRANSPORT
==================================================
*/


function renderTransport(
    dpp
) {

    const container =
        document.getElementById(
            "transport"
        );


    if (!container) {

        return;
    }


    container.innerHTML =
        "";


    if (
        !Array.isArray(
            dpp.transport
        ) ||
        dpp.transport.length === 0
    ) {

        container.textContent =
            "Keine Transportdaten verfügbar.";

        return;
    }


    dpp.transport.forEach(
        transport => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "transport-card";


            if (
                transport.externalTransport ===
                false
            ) {

                card.innerHTML = `

                    <strong>
                        ${transport.fromProcess}
                        →
                        ${transport.toProcess}
                    </strong>

                    <span>
                        Gleicher Standort –
                        kein externer Transport
                    </span>

                `;

            } else {

                card.innerHTML = `

                    <strong>
                        ${
                            transport.fromSite
                                ? transport.fromSite.city
                                : "-"
                        }

                        →

                        ${
                            transport.toSite
                                ? transport.toSite.city
                                : "-"
                        }
                    </strong>


                    <span>

                        ${
                            transport.transportMode
                                ? transport.transportMode.name
                                : "-"
                        }

                        ·

                        ${formatNumber(
                            transport.distanceKm,
                            0
                        )}
                        km

                    </span>

                `;
            }


            container.appendChild(
                card
            );

        }
    );
}



/*
==================================================
UMWELTBILANZ
==================================================
*/


function createEnvironmentalBars(
    title,
    unit,
    values
) {

    const total =
        values.reduce(
            (sum, item) =>
                sum +
                Number(item.value || 0),
            0
        );


    const bars =
        values
            .map(
                item => {

                    const value =
                        Number(
                            item.value || 0
                        );


                    const percent =
                        total > 0
                            ? (
                                value /
                                total
                              ) * 100
                            : 0;


                    return `

                        <div class="environment-row">

                            <div class="environment-row-top">

                                <span>
                                    ${item.label}
                                </span>

                                <strong>
                                    ${formatNumber(value, 3)}
                                    ${unit}
                                </strong>

                            </div>


                            <div class="environment-bar">

                                <span
                                    style="
                                        width:
                                        ${percent}%;
                                    "
                                ></span>

                            </div>

                        </div>

                    `;
                }
            )
            .join("");


    return `

        <div class="environment-chart">

            <h3>
                ${title}
            </h3>

            ${bars}

        </div>

    `;
}



function renderEnvironmentalBalance(
    dpp
) {

    const container =
        document.getElementById(
            "environmentalBalance"
        );


    if (!container) {

        return;
    }


    const balance =
        dpp.environmentalBalance;


    if (!balance) {

        container.textContent =
            "Keine Umweltbilanz verfügbar.";

        return;
    }


    const categories = [

        {
            label:
                "Rohstoffe",

            key:
                "rawMaterials"
        },

        {
            label:
                "Komponenten",

            key:
                "additionalComponents"
        },

        {
            label:
                "Produktion",

            key:
                "production"
        },

        {
            label:
                "Verpackung",

            key:
                "packaging"
        },

        {
            label:
                "Transport",

            key:
                "transport"
        }

    ];


    const co2Values =
        categories.map(
            category => ({

                label:
                    category.label,

                value:
                    balance[
                        category.key
                    ]?.co2Kg || 0

            })
        );


    const waterValues =
        categories.map(
            category => ({

                label:
                    category.label,

                value:
                    balance[
                        category.key
                    ]?.waterLiters || 0

            })
        );


    const energyValues =
        categories.map(
            category => ({

                label:
                    category.label,

                value:
                    balance[
                        category.key
                    ]?.energyKwh || 0

            })
        );


    container.innerHTML = `

        <div class="environment-totals">


            <div class="environment-total">

                <span>
                    CO₂e
                </span>

                <strong>
                    ${formatNumber(
                        balance.total.co2Kg,
                        3
                    )}
                    kg
                </strong>

            </div>


            <div class="environment-total">

                <span>
                    Wasser
                </span>

                <strong>
                    ${formatNumber(
                        balance.total.waterLiters,
                        1
                    )}
                    L
                </strong>

            </div>


            <div class="environment-total">

                <span>
                    Energie
                </span>

                <strong>
                    ${formatNumber(
                        balance.total.energyKwh,
                        3
                    )}
                    kWh
                </strong>

            </div>


        </div>


        ${createEnvironmentalBars(
            "CO₂e nach Bereichen",
            "kg",
            co2Values
        )}


        ${createEnvironmentalBars(
            "Wasser nach Bereichen",
            "L",
            waterValues
        )}


        ${createEnvironmentalBars(
            "Energie nach Bereichen",
            "kWh",
            energyValues
        )}


        <p class="demo-note">
            Die Umweltwerte dieses Demonstrators
            basieren teilweise auf Demo-Datensätzen.
        </p>

    `;
}



/*
==================================================
VERPACKUNG
==================================================
*/


function renderPackaging(
    dpp
) {

    const container =
        document.getElementById(
            "packaging"
        );


    if (!container) {

        return;
    }


    container.innerHTML =
        "";


    if (
        !Array.isArray(
            dpp.packaging
        )
    ) {

        return;
    }


    dpp.packaging.forEach(
        packaging => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "simple-card";


            card.innerHTML = `

                <strong>
                    ${packaging.name}
                </strong>

                <span>
                    ${packaging.material}
                    ·
                    ${packaging.massGrams} g
                    ·
                    ${packaging.recycledContentPercent} %
                    Recyclinganteil
                </span>

            `;


            container.appendChild(
                card
            );

        }
    );
}



/*
==================================================
PFLEGE
==================================================
*/


function renderCare(
    dpp
) {

    const container =
        document.getElementById(
            "care"
        );


    if (!container) {

        return;
    }


    const care =
        dpp.care;


    if (!care) {

        container.textContent =
            "Keine Pflegeinformationen verfügbar.";

        return;
    }


    container.innerHTML = `

        <div class="care-grid">


            <div class="care-item">

                <span>
                    Waschen
                </span>

                <strong>
                    ${
                        care.washingAllowed
                            ? `${care.washingTemperatureC} °C`
                            : "Nicht waschen"
                    }
                </strong>

            </div>


            <div class="care-item">

                <span>
                    Bleichen
                </span>

                <strong>
                    ${
                        care.bleachingAllowed
                            ? "Erlaubt"
                            : "Nicht erlaubt"
                    }
                </strong>

            </div>


            <div class="care-item">

                <span>
                    Trockner
                </span>

                <strong>
                    ${
                        care.tumbleDryingAllowed
                            ? "Erlaubt"
                            : "Nicht empfohlen"
                    }
                </strong>

            </div>


            <div class="care-item">

                <span>
                    Bügeln
                </span>

                <strong>
                    ${
                        care.ironingAllowed
                            ? care.ironingTemperature
                            : "Nicht bügeln"
                    }
                </strong>

            </div>


        </div>


        <div class="information-note">
            ${care.careText}
        </div>

    `;
}



/*
==================================================
HALTBARKEIT
==================================================
*/


function renderDurability(
    dpp
) {

    const container =
        document.getElementById(
            "durability"
        );


    if (!container) {

        return;
    }


    const profile =
        dpp.durability;


    if (!profile) {

        return;
    }


    container.innerHTML = `

        <div class="info-grid">

            <div>

                <span>
                    Abriebfestigkeit
                </span>

                <strong>
                    ${formatNumber(
                        profile.abrasionResistanceCycles,
                        0
                    )}
                    Zyklen
                </strong>

            </div>


            <div>

                <span>
                    Farbechtheit
                </span>

                <strong>
                    ${profile.colorFastnessRating} / 5
                </strong>

            </div>


            <div>

                <span>
                    Nahtfestigkeit
                </span>

                <strong>
                    ${profile.seamStrengthRating}
                </strong>

            </div>


            <div>

                <span>
                    Maßänderung
                </span>

                <strong>
                    ${profile.dimensionalChangePercent} %
                </strong>

            </div>

        </div>


        <div class="information-note">
            ${profile.qualityNote}
        </div>

    `;
}



/*
==================================================
REPARATUR
==================================================
*/


function renderRepair(
    dpp
) {

    const container =
        document.getElementById(
            "repair"
        );


    if (!container) {

        return;
    }


    const repair =
        dpp.repair;


    if (!repair) {

        return;
    }


    const instructions =
        Array.isArray(
            repair.repairInstructions
        )
            ? repair.repairInstructions
                .map(
                    item =>
                        `<li>${item}</li>`
                )
                .join("")
            : "";


    container.innerHTML = `

        <div class="info-grid">

            <div>

                <span>
                    Reparierbar
                </span>

                <strong>
                    ${yesNo(repair.repairable)}
                </strong>

            </div>


            <div>

                <span>
                    Knöpfe austauschbar
                </span>

                <strong>
                    ${yesNo(repair.replaceableButtons)}
                </strong>

            </div>


            <div>

                <span>
                    Nähte reparierbar
                </span>

                <strong>
                    ${yesNo(repair.seamsRepairable)}
                </strong>

            </div>


            <div>

                <span>
                    Reparaturaufwand
                </span>

                <strong>
                    ${repair.repairDifficulty}
                </strong>

            </div>

        </div>


        <h3>
            Reparaturhinweise
        </h3>


        <ul>
            ${instructions}
        </ul>

    `;
}



/*
==================================================
RECYCLING
==================================================
*/


function renderCircularity(
    dpp
) {

    const container =
        document.getElementById(
            "circularity"
        );


    if (!container) {

        return;
    }


    const profile =
        dpp.circularity;


    if (!profile) {

        return;
    }


    const order =
        Array.isArray(
            profile.preferredEndOfLifeOrder
        )
            ? profile.preferredEndOfLifeOrder
                .map(
                    item =>
                        `<li>${item}</li>`
                )
                .join("")
            : "";


    const instructions =
        Array.isArray(
            profile.endOfLifeInstructions
        )
            ? profile.endOfLifeInstructions
                .map(
                    item =>
                        `<li>${item}</li>`
                )
                .join("")
            : "";


    container.innerHTML = `

        <div class="info-grid">

            <div>

                <span>
                    Wiederverwendbar
                </span>

                <strong>
                    ${yesNo(profile.reusable)}
                </strong>

            </div>


            <div>

                <span>
                    Second-Hand geeignet
                </span>

                <strong>
                    ${yesNo(profile.secondHandSuitable)}
                </strong>

            </div>


            <div>

                <span>
                    Recyclingpotenzial
                </span>

                <strong>
                    ${profile.recyclingPotential}
                </strong>

            </div>


            <div>

                <span>
                    Materialtrennung
                </span>

                <strong>
                    ${
                        profile.materialSeparationRecommended
                            ? "Empfohlen"
                            : "Nicht erforderlich"
                    }
                </strong>

            </div>

        </div>


        <div class="information-note">
            ${profile.recyclingReason}
        </div>


        <h3>
            Empfohlene Reihenfolge
        </h3>


        <ol>
            ${order}
        </ol>


        <h3>
            Hinweise zum Lebensende
        </h3>


        <ul>
            ${instructions}
        </ul>

    `;
}



/*
==================================================
TECHNISCHE INFORMATIONEN
==================================================
*/


function renderTechnicalInformation(
    dpp
) {

    const container =
        document.getElementById(
            "technicalInformation"
        );


    if (!container) {

        return;
    }


    container.innerHTML = `

        <div class="technical-grid">


            <div>

                <span>
                    DPP-ID
                </span>

                <strong>
                    ${dpp.dppId}
                </strong>

            </div>


            <div>

                <span>
                    Schema-Version
                </span>

                <strong>
                    ${dpp.schemaVersion}
                </strong>

            </div>


            <div>

                <span>
                    Status
                </span>

                <strong>
                    ${dpp.status}
                </strong>

            </div>


            <div>

                <span>
                    Datenqualität
                </span>

                <strong>
                    ${dpp.dataQuality}
                </strong>

            </div>


            <div>

                <span>
                    Erstellt
                </span>

                <strong>
                    ${
                        new Date(
                            dpp.createdAt
                        ).toLocaleString(
                            "de-DE"
                        )
                    }
                </strong>

            </div>


        </div>

    `;
}



/*
==================================================
DPP DARSTELLEN
==================================================
*/


function renderDpp(
    dpp
) {

    const status =
        document.getElementById(
            "dppStatus"
        );


    if (status) {

        status.innerHTML = `
            <p>
                Digital Product Passport
                erfolgreich geladen.
            </p>
        `;
    }


    renderProductOverview(
        dpp
    );


    renderMaterials(
        dpp
    );


    renderProduction(
        dpp
    );


    renderTransport(
        dpp
    );


    renderEnvironmentalBalance(
        dpp
    );


    renderPackaging(
        dpp
    );


    renderCare(
        dpp
    );


    renderDurability(
        dpp
    );


    renderRepair(
        dpp
    );


    renderCircularity(
        dpp
    );


    renderTechnicalInformation(
        dpp
    );
}



/*
==================================================
START
==================================================
*/


async function startProductPage() {

    const dpp =
        await loadDpp();


    if (!dpp) {

        const status =
            document.getElementById(
                "dppStatus"
            );


        if (status) {

            status.innerHTML = `

                <div class="error-message">

                    <strong>
                        Kein Digital Product Passport gefunden.
                    </strong>

                    <p>
                        Für die angegebene DPP-ID
                        konnte kein Datensatz geladen werden.
                    </p>

                </div>

            `;
        }


        return;
    }


    console.log(
        "DPP für Kundenseite:",
        dpp
    );


    renderDpp(
        dpp
    );
}



startProductPage();