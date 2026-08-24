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


    return parameters.get("id");
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
    1. DPP AUS SUPABASE LADEN
    ==================================================
    */

    if (dppId) {

        try {

            const url =
                `${SUPABASE_DPP_ENDPOINT}` +
                `?dpp_id=eq.${encodeURIComponent(dppId)}` +
                `&select=data`;


            const response =
                await fetch(
                    url,
                    {
                        headers: {
                            "apikey":
                                SUPABASE_PUBLISHABLE_KEY
                        }
                    }
                );


            if (!response.ok) {

                const errorText =
                    await response.text();


                throw new Error(
                    `Supabase Fehler ${response.status}: ${errorText}`
                );
            }


            const result =
                await response.json();


            if (
                Array.isArray(result) &&
                result.length > 0 &&
                result[0].data
            ) {

                console.log(
                    "DPP aus Supabase geladen:",
                    result[0].data
                );


                return result[0].data;
            }


            console.warn(
                "Für diese DPP-ID wurde in Supabase kein Datensatz gefunden."
            );


        } catch (error) {

            console.error(
                "DPP konnte nicht aus Supabase geladen werden:",
                error
            );
        }


        /*
        ==================================================
        2. FALLBACK: LOCALSTORAGE
        ==================================================
        */

        const storedDpp =
            localStorage.getItem(
                `dpp:${dppId}`
            );


        if (storedDpp) {

            console.log(
                "DPP aus localStorage geladen."
            );


            return JSON.parse(
                storedDpp
            );
        }
    }


    /*
    ==================================================
    3. LETZTEN LOKALEN DPP LADEN
    ==================================================
    */

    const currentDpp =
        localStorage.getItem(
            "currentDpp"
        );


    if (currentDpp) {

        return JSON.parse(
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

function renderProductOverview(dpp) {

    const container =
        document.getElementById(
            "productOverview"
        );


    const identification =
        dpp.identification;


    const product =
        dpp.product;


    container.innerHTML = `
        <h2>
            ${identification.productName}
        </h2>

        <p>
            ${identification.description || ""}
        </p>

        <p>
            <strong>Artikelnummer:</strong>
            ${identification.sku}
        </p>

        <p>
            <strong>Größe:</strong>
            ${identification.size.name}
        </p>

        <p>
            <strong>Farbe:</strong>
            ${
                identification.color
                    ? identification.color.name
                    : "-"
            }
        </p>

        <p>
            <strong>Passform:</strong>
            ${identification.fit.name}
        </p>

        <p>
            <strong>Ärmel:</strong>
            ${product.sleeveType}
        </p>

        <p>
            <strong>Kragen:</strong>
            ${product.collarType}
        </p>

        <p>
            <strong>Produktgewicht:</strong>
            ${product.totalProductMassGrams}
            g
        </p>
    `;
}


/*
==================================================
MATERIALIEN
==================================================
*/

function renderMaterials(dpp) {

    const container =
        document.getElementById(
            "materials"
        );


    container.innerHTML = "";


    if (
        !dpp.materials ||
        dpp.materials.length === 0
    ) {

        container.textContent =
            "Keine Materialdaten verfügbar.";

        return;
    }


    dpp.materials.forEach(
        material => {

            const section =
                document.createElement(
                    "div"
                );


            const source =
                material.source;


            section.innerHTML = `
                <h3>
                    ${material.materialName}
                </h3>

                <p>
                    <strong>Anteil:</strong>
                    ${material.percentage}
                    %
                </p>

                <p>
                    <strong>Menge:</strong>
                    ${material.massGrams}
                    g
                </p>

                ${
                    source
                        ? `
                            <p>
                                <strong>Herkunft:</strong>
                                ${source.originRegion},
                                ${source.originCountry}
                            </p>

                            <p>
                                <strong>Lieferant:</strong>
                                ${source.companyName || "-"}
                            </p>

                            <p>
                                <strong>Standort:</strong>
                                ${source.siteName || "-"}
                            </p>

                            <p>
                                <strong>Recyclinganteil:</strong>
                                ${source.recycledContentPercent}
                                %
                            </p>
                        `
                        : `
                            <p>
                                Keine Herkunftsdaten verfügbar.
                            </p>
                        `
                }
            `;


            container.appendChild(
                section
            );
        }
    );
}


/*
==================================================
PRODUKTION
==================================================
*/

function renderProduction(dpp) {

    const container =
        document.getElementById(
            "production"
        );


    container.innerHTML = "";


    if (
        !dpp.production ||
        dpp.production.length === 0
    ) {

        container.textContent =
            "Keine Produktionsdaten verfügbar.";

        return;
    }


    dpp.production.forEach(
        (step, index) => {

            const section =
                document.createElement(
                    "div"
                );


            let site = null;
            let company = null;


            if (step.assignment) {

                site =
                    step.assignment.site;

                company =
                    step.assignment.company;

            } else {

                site =
                    step.site;

                company =
                    step.company;
            }


            section.innerHTML = `
                <h3>
                    ${index + 1}.
                    ${step.processName}
                    ${
                        step.materialName
                            ? ` – ${step.materialName}`
                            : ""
                    }
                </h3>

                ${
                    company
                        ? `
                            <p>
                                <strong>Unternehmen:</strong>
                                ${company.name}
                            </p>
                        `
                        : ""
                }

                ${
                    site
                        ? `
                            <p>
                                <strong>Standort:</strong>
                                ${site.name},
                                ${site.city},
                                ${site.country}
                            </p>
                        `
                        : `
                            <p>
                                Standort nicht verfügbar.
                            </p>
                        `
                }
            `;


            container.appendChild(
                section
            );
        }
    );
}


/*
==================================================
TRANSPORT
==================================================
*/

function renderTransport(dpp) {

    const container =
        document.getElementById(
            "transport"
        );


    container.innerHTML = "";


    if (
        !dpp.transport ||
        dpp.transport.length === 0
    ) {

        container.textContent =
            "Keine Transportdaten verfügbar.";

        return;
    }


    dpp.transport.forEach(
        transport => {

            const section =
                document.createElement(
                    "div"
                );


            if (
                transport.externalTransport === false
            ) {

                section.innerHTML = `
                    <p>
                        ${transport.fromProcess}
                        →
                        ${transport.toProcess}
                    </p>

                    <p>
                        Kein externer Transport erforderlich.
                    </p>
                `;

            } else if (
                transport.status ===
                "missing-route"
            ) {

                section.innerHTML = `
                    <p>
                        ${transport.fromProcess}
                        →
                        ${transport.toProcess}
                    </p>

                    <p>
                        Transportdaten nicht vollständig verfügbar.
                    </p>
                `;

            } else {

                section.innerHTML = `
                    <h3>
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
                    </h3>

                    <p>
                        <strong>Transportmittel:</strong>
                        ${
                            transport.transportMode
                                ? transport.transportMode.name
                                : "-"
                        }
                    </p>

                    <p>
                        <strong>Entfernung:</strong>
                        ${transport.distanceKm}
                        km
                    </p>
                `;
            }


            container.appendChild(
                section
            );
        }
    );
}


/*
==================================================
UMWELTBILANZ
==================================================
*/

function renderEnvironmentalBalance(
    dpp
) {

    const container =
        document.getElementById(
            "environmentalBalance"
        );


    const balance =
        dpp.environmentalBalance;


    if (!balance) {

        container.textContent =
            "Keine Umweltbilanz verfügbar.";

        return;
    }


    container.innerHTML = `
        <p>
            <strong>CO₂:</strong>
            ${balance.total.co2Kg}
            kg CO₂e
        </p>

        <p>
            <strong>Wasser:</strong>
            ${balance.total.waterLiters}
            L
        </p>

        <p>
            <strong>Energie:</strong>
            ${balance.total.energyKwh}
            kWh
        </p>


        <h3>
            CO₂ nach Bereichen
        </h3>

        <p>
            Rohstoffe:
            ${balance.rawMaterials.co2Kg}
            kg CO₂e
        </p>

        <p>
            Weitere Komponenten:
            ${balance.additionalComponents.co2Kg}
            kg CO₂e
        </p>

        <p>
            Produktion:
            ${balance.production.co2Kg}
            kg CO₂e
        </p>

        <p>
            Verpackung:
            ${balance.packaging.co2Kg}
            kg CO₂e
        </p>

        <p>
            Transport:
            ${balance.transport.co2Kg}
            kg CO₂e
        </p>

        <p>
            <em>
                Die Umweltwerte des Demonstrators
                basieren teilweise auf hinterlegten
                Demo-Datensätzen.
            </em>
        </p>
    `;
}


/*
==================================================
VERPACKUNG
==================================================
*/

function renderPackaging(dpp) {

    const container =
        document.getElementById(
            "packaging"
        );


    container.innerHTML = "";


    if (
        !dpp.packaging ||
        dpp.packaging.length === 0
    ) {

        container.textContent =
            "Keine Verpackungsdaten verfügbar.";

        return;
    }


    dpp.packaging.forEach(
        packaging => {

            const section =
                document.createElement(
                    "div"
                );


            section.innerHTML = `
                <h3>
                    ${packaging.name}
                </h3>

                <p>
                    <strong>Material:</strong>
                    ${packaging.material}
                </p>

                <p>
                    <strong>Masse:</strong>
                    ${packaging.massGrams}
                    g
                </p>

                <p>
                    <strong>Recyclinganteil:</strong>
                    ${packaging.recycledContentPercent}
                    %
                </p>

                <p>
                    <strong>Recycelbar:</strong>
                    ${yesNo(packaging.recyclable)}
                </p>
            `;


            container.appendChild(
                section
            );
        }
    );
}


/*
==================================================
PFLEGE
==================================================
*/

function renderCare(dpp) {

    const container =
        document.getElementById(
            "care"
        );


    const care =
        dpp.care;


    if (!care) {

        container.textContent =
            "Keine Pflegeinformationen verfügbar.";

        return;
    }


    container.innerHTML = `
        <p>
            <strong>Waschen:</strong>
            ${
                care.washingAllowed
                    ? `${care.washingTemperatureC} °C`
                    : "Nicht waschen"
            }
        </p>

        <p>
            <strong>Bleichen:</strong>
            ${
                care.bleachingAllowed
                    ? "Erlaubt"
                    : "Nicht erlaubt"
            }
        </p>

        <p>
            <strong>Trockner:</strong>
            ${
                care.tumbleDryingAllowed
                    ? "Erlaubt"
                    : "Nicht empfohlen"
            }
        </p>

        <p>
            <strong>Lufttrocknung:</strong>
            ${
                care.airDryingRecommended
                    ? "Empfohlen"
                    : "-"
            }
        </p>

        <p>
            <strong>Bügeln:</strong>
            ${
                care.ironingAllowed
                    ? care.ironingTemperature
                    : "Nicht bügeln"
            }
        </p>

        <p>
            <strong>Empfehlung:</strong><br>
            ${care.careText}
        </p>

        <p>
            <em>
                Eine sachgerechte Pflege kann
                die Lebensdauer des Produktes verlängern.
            </em>
        </p>
    `;
}


/*
==================================================
HALTBARKEIT
==================================================
*/

function renderDurability(dpp) {

    const container =
        document.getElementById(
            "durability"
        );


    const profile =
        dpp.durability;


    if (!profile) {

        container.textContent =
            "Keine Haltbarkeitsdaten verfügbar.";

        return;
    }


    container.innerHTML = `
        <p>
            <strong>Abriebfestigkeit:</strong>
            ${profile.abrasionResistanceCycles.toLocaleString("de-DE")}
            Zyklen
        </p>

        <p>
            <strong>Farbechtheit:</strong>
            ${profile.colorFastnessRating}
            / 5
        </p>

        <p>
            <strong>Nahtfestigkeit:</strong>
            ${profile.seamStrengthRating}
        </p>

        <p>
            <strong>Maßänderung:</strong>
            ${profile.dimensionalChangePercent}
            %
        </p>

        <p>
            ${profile.qualityNote}
        </p>
    `;
}


/*
==================================================
REPARATUR
==================================================
*/

function renderRepair(dpp) {

    const container =
        document.getElementById(
            "repair"
        );


    const repair =
        dpp.repair;


    if (!repair) {

        container.textContent =
            "Keine Reparaturinformationen verfügbar.";

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
        <p>
            <strong>Reparierbar:</strong>
            ${yesNo(repair.repairable)}
        </p>

        <p>
            <strong>Knöpfe austauschbar:</strong>
            ${yesNo(repair.replaceableButtons)}
        </p>

        <p>
            <strong>Nähte reparierbar:</strong>
            ${yesNo(repair.seamsRepairable)}
        </p>

        <p>
            <strong>Ersatzknopf enthalten:</strong>
            ${yesNo(repair.spareButtonIncluded)}
        </p>

        <p>
            <strong>Reparaturaufwand:</strong>
            ${repair.repairDifficulty}
        </p>

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
KREISLAUFWIRTSCHAFT
==================================================
*/

function renderCircularity(dpp) {

    const container =
        document.getElementById(
            "circularity"
        );


    const profile =
        dpp.circularity;


    if (!profile) {

        container.textContent =
            "Keine Recyclinginformationen verfügbar.";

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


    container.innerHTML = `
        <p>
            <strong>Wiederverwendbar:</strong>
            ${yesNo(profile.reusable)}
        </p>

        <p>
            <strong>Second-Hand geeignet:</strong>
            ${yesNo(profile.secondHandSuitable)}
        </p>

        <p>
            <strong>Recyclingpotenzial:</strong>
            ${profile.recyclingPotential}
        </p>

        <p>
            ${profile.recyclingReason}
        </p>

        <h3>
            Empfohlene Reihenfolge
        </h3>

        <ol>
            ${order}
        </ol>
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


    container.innerHTML = `
        <p>
            <strong>DPP-ID:</strong>
            ${dpp.dppId}
        </p>

        <p>
            <strong>Schema-Version:</strong>
            ${dpp.schemaVersion}
        </p>

        <p>
            <strong>Status:</strong>
            ${dpp.status}
        </p>

        <p>
            <strong>Datenqualität:</strong>
            ${dpp.dataQuality}
        </p>

        <p>
            <strong>Erstellt:</strong>
            ${
                new Date(
                    dpp.createdAt
                ).toLocaleString(
                    "de-DE"
                )
            }
        </p>
    `;
}


/*
==================================================
DPP DARSTELLEN
==================================================
*/

function renderDpp(dpp) {

    const status =
        document.getElementById(
            "dppStatus"
        );


    status.innerHTML = `
        <p>
            Digital Product Passport
            erfolgreich geladen.
        </p>
    `;


    renderProductOverview(dpp);

    renderMaterials(dpp);

    renderProduction(dpp);

    renderTransport(dpp);

    renderEnvironmentalBalance(dpp);

    renderPackaging(dpp);

    renderCare(dpp);

    renderDurability(dpp);

    renderRepair(dpp);

    renderCircularity(dpp);

    renderTechnicalInformation(dpp);
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


        status.innerHTML = `
            <p>
                <strong>
                    Kein Digital Product Passport gefunden.
                </strong>
            </p>

            <p>
                Für die angegebene DPP-ID konnte
                kein Datensatz gefunden werden.
            </p>

            <p>
                <a href="manufacturer.html">
                    Herstellerbereich öffnen
                </a>
            </p>
        `;


        return;
    }


    renderDpp(
        dpp
    );
}


startProductPage();