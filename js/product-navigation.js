/*
==================================================
DPP NAVIGATION
==================================================
*/


const navigationItems =
    document.querySelectorAll(
        ".nav-item"
    );


const panels =
    document.querySelectorAll(
        ".tab-panel"
    );



navigationItems.forEach(
    item => {

        item.addEventListener(
            "click",
            () => {

                const panelId =
                    item.dataset.panel;


                navigationItems.forEach(
                    navigationItem => {

                        navigationItem.classList.remove(
                            "active"
                        );
                    }
                );


                panels.forEach(
                    panel => {

                        panel.classList.remove(
                            "active"
                        );
                    }
                );


                item.classList.add(
                    "active"
                );


                const selectedPanel =
                    document.getElementById(
                        panelId
                    );


                if (selectedPanel) {

                    selectedPanel.classList.add(
                        "active"
                    );
                }


                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            }
        );

    }
);