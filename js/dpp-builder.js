/*
==================================================
DPP BUILDER

Erzeugt aus dem aktuellen Zustand des
Herstellerbereichs einen konkreten
Digital Product Passport.
==================================================
*/

function getSelectedOptionData(selectId) {
    const select = document.getElementById(selectId);

    if (!select || !select.value) {
        return null;
    }

    const option = select.options[select.selectedIndex];

    return {
        id: select.value,
        name: option ? option.textContent : select.value
    };
}


function createDppId(sku) {
    const timestamp = new Date()
        .toISOString()
        .replace(/\D/g, "")
        .slice(0, 17);

    return `DPP-${sku}-${timestamp}`;
}


function findProfile(data, id) {
    if (!id) {
        return null;
    }

    return data.find(item => item.id === id) || null;
}


function buildDppMaterials(product, totalFabricWeightKg, warnings) {
    if (!Array.isArray(product.materialComposition)) {
        return [];
    }

    return product.materialComposition.map(composition => {
        const material = materials.find(
            item => item.id === composition.materialId
        );

        const source = getSelectedMaterialSource(
            composition.materialId
        );

        const massKg =
            totalFabricWeightKg *
            (composition.percentage / 100);

        if (!source) {
            warnings.push(
                `Keine Rohstoffquelle für ${
                    material
                        ? material.name
                        : composition.materialId
                } ausgewählt.`
            );
        }

        const company = source
            ? companies.find(
                item => item.id === source.companyId
            )
            : null;

        const site = source
            ? sites.find(
                item => item.id === source.siteId
            )
            : null;

        return {
            materialId: composition.materialId,

            materialName:
                material
                    ? material.name
                    : composition.materialId,

            percentage:
                composition.percentage,

            massGrams:
                Number(
                    (massKg * 1000).toFixed(2)
                ),

            source: source
                ? {
                    sourceId:
                        source.id,

                    name:
                        source.name,

                    companyId:
                        source.companyId,

                    companyName:
                        company
                            ? company.name
                            : null,

                    siteId:
                        source.siteId,

                    siteName:
                        site
                            ? site.name
                            : null,

                    city:
                        site
                            ? site.city
                            : null,

                    country:
                        site
                            ? site.country
                            : null,

                    originRegion:
                        source.originRegion,

                    originCountry:
                        source.originCountry,

                    recycledContentPercent:
                        source.recycledContent,

                    certifications:
                        source.certifications || [],

                    dataQuality:
                        source.dataQuality
                }
                : null
        };
    });
}


function buildDppComponents(product) {
    if (!Array.isArray(product.components)) {
        return [];
    }

    return product.components
        .map(productComponent => {
            const component =
                components.find(
                    item =>
                        item.id ===
                        productComponent.componentId
                );

            if (!component) {
                return null;
            }

            const material =
                materials.find(
                    item =>
                        item.id ===
                        component.materialId
                );

            return {
                componentId:
                    component.id,

                name:
                    component.name,

                category:
                    component.category,

                materialId:
                    component.materialId,

                materialName:
                    material
                        ? material.name
                        : component.materialId,

                quantity:
                    productComponent.quantity,

                unit:
                    component.unit,

                dataQuality:
                    component.dataQuality
            };
        })
        .filter(Boolean);
}


function buildDppPackaging(product) {
    if (!Array.isArray(product.packaging)) {
        return [];
    }

    return product.packaging
        .map(productPackaging => {
            const packagingMaterial =
                packagingMaterials.find(
                    item =>
                        item.id ===
                        productPackaging.packagingMaterialId
                );

            if (!packagingMaterial) {
                return null;
            }

            return {
                packagingMaterialId:
                    packagingMaterial.id,

                name:
                    packagingMaterial.name,

                material:
                    packagingMaterial.material,

                massGrams:
                    Number(
                        productPackaging.quantityGrams
                    ),

                recycledContentPercent:
                    packagingMaterial.recycledContent,

                recyclable:
                    packagingMaterial.recyclable,

                dataQuality:
                    packagingMaterial.dataQuality
            };
        })
        .filter(Boolean);
}


function buildDppProduction(product, warnings) {
    const chain =
        processChains.find(
            item =>
                item.productId ===
                product.id
        );

    if (!chain) {
        warnings.push(
            "Keine Prozesskette vorhanden."
        );

        return [];
    }

    return chain.steps.map(step => {
        const process =
            processes.find(
                item =>
                    item.id ===
                    step.processType
            );

        const material =
            step.materialId
                ? materials.find(
                    item =>
                        item.id ===
                        step.materialId
                )
                : null;

        const baseData = {
            stepId:
                step.id,

            processType:
                step.processType,

            processName:
                process
                    ? process.name
                    : step.processType,

            branch:
                step.branch,

            materialId:
                step.materialId || null,

            materialName:
                material
                    ? material.name
                    : null,

            previousSteps:
                step.previousSteps || []
        };

        if (
            step.processType ===
                "cotton-processing" ||
            step.processType ===
                "polyester-production"
        ) {
            const source =
                step.materialId
                    ? getSelectedMaterialSource(
                        step.materialId
                    )
                    : null;

            const company =
                source
                    ? companies.find(
                        item =>
                            item.id ===
                            source.companyId
                    )
                    : null;

            const site =
                source
                    ? sites.find(
                        item =>
                            item.id ===
                            source.siteId
                    )
                    : null;

            if (!source) {
                warnings.push(
                    `Keine Rohstoffquelle für ${baseData.processName} vorhanden.`
                );
            }

            return {
                ...baseData,

                company:
                    company
                        ? {
                            id:
                                company.id,

                            name:
                                company.name
                        }
                        : null,

                site:
                    site
                        ? {
                            id:
                                site.id,

                            name:
                                site.name,

                            city:
                                site.city,

                            country:
                                site.country
                        }
                        : null
            };
        }

        const companySelect =
            document.getElementById(
                `company-${step.id}`
            );

        const siteSelect =
            document.getElementById(
                `site-${step.id}`
            );

        const departmentSelect =
            document.getElementById(
                `department-${step.id}`
            );

        if (
            !siteSelect ||
            !siteSelect.value ||
            !departmentSelect ||
            !departmentSelect.value
        ) {
            warnings.push(
                `Keine vollständige Produktionszuordnung für ${baseData.processName}.`
            );

            return {
                ...baseData,
                assignment: null
            };
        }

        const site =
            sites.find(
                item =>
                    item.id ===
                    siteSelect.value
            );

        const department =
            departments.find(
                item =>
                    item.id ===
                    departmentSelect.value
            );

        let company = null;

        if (
            companySelect &&
            companySelect.value
        ) {
            company =
                companies.find(
                    item =>
                        item.id ===
                        companySelect.value
                );

        } else if (site) {
            company =
                companies.find(
                    item =>
                        item.id ===
                        site.companyId
                );
        }

        return {
            ...baseData,

            assignment: {
                company:
                    company
                        ? {
                            id:
                                company.id,

                            name:
                                company.name
                        }
                        : null,

                site:
                    site
                        ? {
                            id:
                                site.id,

                            name:
                                site.name,

                            city:
                                site.city,

                            country:
                                site.country
                        }
                        : null,

                department:
                    department
                        ? {
                            id:
                                department.id,

                            name:
                                department.name
                        }
                        : null
            }
        };
    });
}


function buildDppTransport(
    product,
    totalFabricWeightKg,
    warnings
) {
    const chain =
        processChains.find(
            item =>
                item.productId ===
                product.id
        );

    if (!chain) {
        return [];
    }

    const result = [];

    chain.steps.forEach(
        currentStep => {
            if (
                !Array.isArray(
                    currentStep.previousSteps
                )
            ) {
                return;
            }

            currentStep.previousSteps.forEach(
                previousStepId => {
                    const previousStep =
                        chain.steps.find(
                            item =>
                                item.id ===
                                previousStepId
                        );

                    if (!previousStep) {
                        return;
                    }

                    const fromSiteId =
                        getStepSiteId(
                            previousStep
                        );

                    const toSiteId =
                        getStepSiteId(
                            currentStep
                        );

                    if (
                        !fromSiteId ||
                        !toSiteId
                    ) {
                        warnings.push(
                            `Transport ${previousStep.id} → ${currentStep.id} konnte nicht vollständig bestimmt werden.`
                        );

                        return;
                    }

                    const fromSite =
                        sites.find(
                            item =>
                                item.id ===
                                fromSiteId
                        );

                    const toSite =
                        sites.find(
                            item =>
                                item.id ===
                                toSiteId
                        );

                    const massKg =
                        getTransportMassKg(
                            previousStep,
                            product,
                            totalFabricWeightKg
                        );

                    const commonData = {
                        fromStepId:
                            previousStep.id,

                        toStepId:
                            currentStep.id,

                        fromProcess:
                            getStepLabel(
                                previousStep
                            ),

                        toProcess:
                            getStepLabel(
                                currentStep
                            ),

                        fromSite:
                            fromSite
                                ? {
                                    id:
                                        fromSite.id,

                                    name:
                                        fromSite.name,

                                    city:
                                        fromSite.city,

                                    country:
                                        fromSite.country
                                }
                                : null,

                        toSite:
                            toSite
                                ? {
                                    id:
                                        toSite.id,

                                    name:
                                        toSite.name,

                                    city:
                                        toSite.city,

                                    country:
                                        toSite.country
                                }
                                : null,

                        transportedMassGrams:
                            Number(
                                (
                                    massKg * 1000
                                ).toFixed(2)
                            )
                    };

                    if (
                        fromSiteId ===
                        toSiteId
                    ) {
                        result.push({
                            ...commonData,

                            externalTransport:
                                false,

                            status:
                                "same-site",

                            distanceKm:
                                0,

                            transportMode:
                                null,

                            impact: {
                                co2Kg:
                                    0,

                                energyKwh:
                                    0
                            }
                        });

                        return;
                    }

                    const route =
                        findTransportRoute(
                            fromSiteId,
                            toSiteId
                        );

                    if (!route) {
                        warnings.push(
                            `Keine Transportroute von ${
                                fromSite
                                    ? fromSite.name
                                    : fromSiteId
                            } nach ${
                                toSite
                                    ? toSite.name
                                    : toSiteId
                            } hinterlegt.`
                        );

                        result.push({
                            ...commonData,

                            externalTransport:
                                true,

                            status:
                                "missing-route",

                            distanceKm:
                                null,

                            transportMode:
                                null,

                            impact:
                                null
                        });

                        return;
                    }

                    const mode =
                        transportModes.find(
                            item =>
                                item.id ===
                                route.defaultTransportModeId
                        );

                    if (!mode) {
                        warnings.push(
                            `Transportmittel für Route ${route.id} wurde nicht gefunden.`
                        );
                    }

                    const tonneKilometres =
                        (massKg / 1000) *
                        route.distanceKm;

                    const co2 =
                        mode
                            ? tonneKilometres *
                              mode.co2KgPerTonneKm
                            : null;

                    const energy =
                        mode
                            ? tonneKilometres *
                              mode.energyKwhPerTonneKm
                            : null;

                    result.push({
                        ...commonData,

                        externalTransport:
                            true,

                        status:
                            mode
                                ? "calculated"
                                : "missing-mode",

                        distanceKm:
                            route.distanceKm,

                        transportMode:
                            mode
                                ? {
                                    id:
                                        mode.id,

                                    name:
                                        mode.name
                                }
                                : null,

                        impact:
                            mode
                                ? {
                                    co2Kg:
                                        Number(
                                            co2.toFixed(5)
                                        ),

                                    energyKwh:
                                        Number(
                                            energy.toFixed(5)
                                        )
                                }
                                : null
                    });
                }
            );
        }
    );

    return result;
}


function buildDigitalProductPassport() {
    const warnings = [];

    const base =
        getProductCalculationBase();

    if (!base) {
        throw new Error(
            "Produktdaten konnten nicht ermittelt werden."
        );
    }

    const {
        product,
        size,
        fit,
        fabricArea,
        totalFabricWeightGrams,
        totalFabricWeightKg
    } = base;

    const variantSelect =
        document.getElementById(
            "variant"
        );

    const variant =
        variantSelect
            ? variants.find(
                item =>
                    item.id ===
                    variantSelect.value
            )
            : null;

    const colorData =
        getSelectedOptionData(
            "color"
        );

    const sku =
        variant
            ? variant.sku
            : "UNKNOWN";

    if (!variant) {
        warnings.push(
            "Keine gültige Variante ausgewählt."
        );
    }

    const productMassKg =
        totalFabricWeightKg +
        currentComponentTotals.massKg;

    const shippingMassKg =
        productMassKg +
        currentPackagingTotals.massKg;

    const totalCo2 =
        currentRawTotals.co2 +
        currentComponentTotals.co2 +
        currentPackagingTotals.co2 +
        currentProductionTotals.co2 +
        currentTransportTotals.co2;

    const totalWater =
        currentRawTotals.water +
        currentComponentTotals.water +
        currentPackagingTotals.water +
        currentProductionTotals.water;

    const totalEnergy =
        currentRawTotals.energy +
        currentComponentTotals.energy +
        currentPackagingTotals.energy +
        currentProductionTotals.energy +
        currentTransportTotals.energy;

    const dpp = {
        schemaVersion:
            "0.1-demo",

        dppId:
            createDppId(sku),

        passportLevel:
            "variant-demo",

        createdAt:
            new Date().toISOString(),

        status:
            "complete",

        dataQuality:
            "demonstrator",

        identification: {
            sku:
                sku,

            variantId:
                variant
                    ? variant.id
                    : null,

            productId:
                product.id,

            productName:
                product.name,

            category:
                product.category,

            description:
                product.description,

            size: {
                id:
                    size.id,

                name:
                    size.name
            },

            color:
                colorData,

            fit: {
                id:
                    fit.id,

                name:
                    fit.name
            }
        },

        product: {
            sleeveType:
                product.sleeveType,

            collarType:
                product.collarType,

            buttonCount:
                product.buttonCount,

            referenceSize:
                product.referenceSize,

            calculatedFabricAreaM2:
                Number(
                    fabricArea.toFixed(4)
                ),

            fabricWeightGramsPerM2:
                product.fabricWeight,

            mainFabricMassGrams:
                Number(
                    totalFabricWeightGrams
                        .toFixed(2)
                ),

            additionalComponentsMassGrams:
                Number(
                    (
                        currentComponentTotals.massKg *
                        1000
                    ).toFixed(2)
                ),

            totalProductMassGrams:
                Number(
                    (
                        productMassKg *
                        1000
                    ).toFixed(2)
                ),

            packagingMassGrams:
                Number(
                    (
                        currentPackagingTotals.massKg *
                        1000
                    ).toFixed(2)
                ),

            shippingUnitMassGrams:
                Number(
                    (
                        shippingMassKg *
                        1000
                    ).toFixed(2)
                )
        },

        materials:
            buildDppMaterials(
                product,
                totalFabricWeightKg,
                warnings
            ),

        components:
            buildDppComponents(
                product
            ),

        production:
            buildDppProduction(
                product,
                warnings
            ),

        transport:
            buildDppTransport(
                product,
                totalFabricWeightKg,
                warnings
            ),

        packaging:
            buildDppPackaging(
                product
            ),

        environmentalBalance: {
            rawMaterials: {
                co2Kg:
                    Number(
                        currentRawTotals.co2
                            .toFixed(4)
                    ),

                waterLiters:
                    Number(
                        currentRawTotals.water
                            .toFixed(4)
                    ),

                energyKwh:
                    Number(
                        currentRawTotals.energy
                            .toFixed(4)
                    )
            },

            additionalComponents: {
                co2Kg:
                    Number(
                        currentComponentTotals.co2
                            .toFixed(4)
                    ),

                waterLiters:
                    Number(
                        currentComponentTotals.water
                            .toFixed(4)
                    ),

                energyKwh:
                    Number(
                        currentComponentTotals.energy
                            .toFixed(4)
                    )
            },

            packaging: {
                co2Kg:
                    Number(
                        currentPackagingTotals.co2
                            .toFixed(4)
                    ),

                waterLiters:
                    Number(
                        currentPackagingTotals.water
                            .toFixed(4)
                    ),

                energyKwh:
                    Number(
                        currentPackagingTotals.energy
                            .toFixed(4)
                    )
            },

            production: {
                co2Kg:
                    Number(
                        currentProductionTotals.co2
                            .toFixed(4)
                    ),

                waterLiters:
                    Number(
                        currentProductionTotals.water
                            .toFixed(4)
                    ),

                energyKwh:
                    Number(
                        currentProductionTotals.energy
                            .toFixed(4)
                    )
            },

            transport: {
                co2Kg:
                    Number(
                        currentTransportTotals.co2
                            .toFixed(5)
                    ),

                energyKwh:
                    Number(
                        currentTransportTotals.energy
                            .toFixed(5)
                    )
            },

            total: {
                co2Kg:
                    Number(
                        totalCo2.toFixed(4)
                    ),

                waterLiters:
                    Number(
                        totalWater.toFixed(4)
                    ),

                energyKwh:
                    Number(
                        totalEnergy.toFixed(4)
                    )
            }
        },

        care:
            findProfile(
                careProfiles,
                product.careProfileId
            ),

        durability:
            findProfile(
                durabilityProfiles,
                product.durabilityProfileId
            ),

        repair:
            findProfile(
                repairProfiles,
                product.repairProfileId
            ),

        circularity:
            findProfile(
                circularityProfiles,
                product.circularityProfileId
            ),

        validation: {
            warningCount:
                warnings.length,

            warnings:
                warnings
        }
    };

    dpp.status =
        warnings.length === 0
            ? "complete"
            : "complete-with-warnings";

    return dpp;
}


function saveDppLocally(dpp) {
    localStorage.setItem(
        `dpp:${dpp.dppId}`,
        JSON.stringify(dpp)
    );

    localStorage.setItem(
        "currentDpp",
        JSON.stringify(dpp)
    );

    const existingIndex =
        JSON.parse(
            localStorage.getItem(
                "dppIndex"
            ) || "[]"
        );

    if (
        !existingIndex.includes(
            dpp.dppId
        )
    ) {
        existingIndex.push(
            dpp.dppId
        );
    }

    localStorage.setItem(
        "dppIndex",
        JSON.stringify(
            existingIndex
        )
    );
}


async function createDpp() {

    const preview =
        document.getElementById(
            "dppPreview"
        );


    const status =
        document.getElementById(
            "dppStatus"
        );


    try {

        /*
        Aktuelle Berechnungen durchführen
        */

        calculateRawMaterialBalance();

        calculateComponentBalance();

        calculatePackagingBalance();

        calculateProductionBalance();

        calculateTransportBalance();

        calculateOverallBalance();


        /*
        DPP erzeugen
        */

        const dpp =
            buildDigitalProductPassport();


        /*
        Lokal speichern
        */

        saveDppLocally(
            dpp
        );


        /*
        Online in Supabase speichern
        */

        let onlineSaved =
            false;


        let onlineError =
            null;


        try {

            await saveDppOnline(
                dpp
            );


            onlineSaved =
                true;


            console.log(
                "DPP erfolgreich in Supabase gespeichert:",
                dpp.dppId
            );


        } catch (error) {

            onlineError =
                error;


            console.error(
                "Online-Speicherung fehlgeschlagen:",
                error
            );
        }


        /*
        JSON-Vorschau
        */

        if (preview) {

            preview.textContent =
                JSON.stringify(
                    dpp,
                    null,
                    2
                );
        }


        /*
        Warnungen im DPP
        */

        const warningText =
            dpp.validation.warningCount > 0
                ? `
                    <p>
                        Hinweis:
                        ${dpp.validation.warningCount}
                        Warnung(en) im Datensatz.
                    </p>
                `
                : `
                    <p>
                        Alle aktuell benötigten
                        Daten sind vorhanden.
                    </p>
                `;


        /*
        Status Online-Speicherung
        */

        const onlineText =
            onlineSaved
                ? `
                    <p>
                        <strong>
                            ✓ DPP wurde online gespeichert.
                        </strong>
                    </p>
                `
                : `
                    <p>
                        <strong>
                            ⚠ DPP wurde lokal erzeugt,
                            konnte aber nicht online
                            gespeichert werden.
                        </strong>
                    </p>

                    <p>
                        ${
                            onlineError
                                ? onlineError.message
                                : ""
                        }
                    </p>
                `;


        /*
        Status anzeigen
        */

        if (status) {

            status.innerHTML = `
                <p>
                    <strong>
                        DPP erfolgreich erzeugt.
                    </strong>
                </p>

                <p>
                    DPP-ID:
                    <strong>
                        ${dpp.dppId}
                    </strong>
                </p>

                <p>
                    Artikelnummer:
                    ${dpp.identification.sku}
                </p>

                ${onlineText}

                ${warningText}

                <p>
                    <a href="product.html?id=${encodeURIComponent(dpp.dppId)}">
                        Produktpass öffnen
                    </a>
                </p>
            `;
        }


    } catch (error) {

        console.error(
            "DPP konnte nicht erzeugt werden:",
            error
        );


        if (status) {

            status.innerHTML = `
                <p>
                    <strong>
                        DPP konnte nicht erzeugt werden.
                    </strong>
                </p>

                <p>
                    ${error.message}
                </p>
            `;
        }
    }
}


const createDppButton =
    document.getElementById(
        "createDppButton"
    );


if (createDppButton) {
    createDppButton.addEventListener(
        "click",
        createDpp
    );
}