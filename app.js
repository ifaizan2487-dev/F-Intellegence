/* =========================================================
   F-INTELLIGENCE
   APP.JS — PART 4
   ========================================================= */

"use strict";

(function () {

    /* =====================================================
       SUPABASE CLIENT
       ===================================================== */

    const supabaseClient =
        window.supabaseClient || null;

    console.log(
        "F-Intelligence: Supabase client available =",
        !!supabaseClient
    );


    /* =====================================================
       EDGE FUNCTION
       ===================================================== */

    const F_INTELLIGENCE_FUNCTION_URL =
        "https://mkkgnkvbumskwnnrlxeh.supabase.co/functions/v1/f-intelligence";


    /* =====================================================
       ELEMENTS
       ===================================================== */

    const chatArea =
        document.getElementById("chatArea");

    const welcomeScreen =
        document.getElementById("welcomeScreen");

    const messages =
        document.getElementById("messages");

    const messageInput =
        document.getElementById("messageInput");

    const sendBtn =
        document.getElementById("sendBtn");

    const newChatBtn =
        document.getElementById("newChatBtn");

    const suggestionCards =
        document.querySelectorAll(
            ".suggestion-card"
        );


    /* =====================================================
       STATE
       ===================================================== */

    let conversation = [];

    let isGenerating = false;

    let typingElement = null;


    /* =====================================================
       INITIALIZE
       ===================================================== */

    function init() {

        if (!messageInput) {

            console.error(
                "F-Intelligence: messageInput not found."
            );

            return;
        }


        if (!sendBtn) {

            console.error(
                "F-Intelligence: sendBtn not found."
            );

            return;
        }


        autoResizeInput();


        messageInput.addEventListener(
            "input",
            autoResizeInput
        );


        messageInput.addEventListener(
            "keydown",
            handleInputKeydown
        );


        sendBtn.addEventListener(
            "click",
            sendMessage
        );


        if (newChatBtn) {

            newChatBtn.addEventListener(
                "click",
                newChat
            );

        }


        suggestionCards.forEach(
            function (card) {

                card.addEventListener(
                    "click",
                    function () {

                        const prompt =
                            card.dataset.prompt || "";


                        if (!prompt) {
                            return;
                        }


                        messageInput.value =
                            prompt;


                        autoResizeInput();


                        messageInput.focus();

                    }
                );

            }
        );


        updateSendButton();


        console.log(
            "F-Intelligence: app initialized."
        );

    }


    /* =====================================================
       INPUT
       ===================================================== */

    function handleInputKeydown(event) {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();

        }

    }


    function autoResizeInput() {

        if (!messageInput) {
            return;
        }


        messageInput.style.height =
            "auto";


        const height =
            Math.min(
                messageInput.scrollHeight,
                150
            );


        messageInput.style.height =
            height + "px";


        updateSendButton();

    }


    function updateSendButton() {

        if (!messageInput || !sendBtn) {
            return;
        }


        const hasText =
            messageInput.value
                .trim()
                .length > 0;


        sendBtn.disabled =
            !hasText ||
            isGenerating;

    }


    /* =====================================================
       SEND MESSAGE
       ===================================================== */

    async function sendMessage() {

        if (isGenerating) {
            return;
        }


        if (!messageInput) {
            return;
        }


        const text =
            messageInput.value
                .trim();


        if (!text) {
            return;
        }


        /* Hide welcome screen */

        if (welcomeScreen) {

            welcomeScreen.style.display =
                "none";

        }


        /* Clear input */

        messageInput.value =
            "";

        autoResizeInput();


        /* Add user message */

        addMessage(
            "user",
            text
        );


        /* Save conversation */

        conversation.push({

            role: "user",

            content: text,

            timestamp: Date.now()

        });


        /* Generate AI response */

        await generateAIResponse(
            text
        );

    }


    /* =====================================================
       ADD MESSAGE
       ===================================================== */

    function addMessage(
        role,
        text
    ) {

        if (!messages) {
            return null;
        }


        const wrapper =
            document.createElement(
                "div"
            );


        wrapper.className =
            "message " + role;


        const bubble =
            document.createElement(
                "div"
            );


        bubble.className =
            "message-bubble";


        /*
         * textContent prevents AI/user
         * text from being interpreted as HTML.
         */

        bubble.textContent =
            text;


        wrapper.appendChild(
            bubble
        );


        messages.appendChild(
            wrapper
        );


        scrollToBottom();


        return wrapper;

    }


    /* =====================================================
       TYPING INDICATOR
       ===================================================== */

    function showTyping() {

        if (!messages) {
            return;
        }


        if (typingElement) {
            return;
        }


        typingElement =
            document.createElement(
                "div"
            );


        typingElement.className =
            "message ai";


        const bubble =
            document.createElement(
                "div"
            );


        bubble.className =
            "message-bubble";


        bubble.innerHTML = `
            <span class="typing-dot">●</span>
            <span class="typing-dot">●</span>
            <span class="typing-dot">●</span>
        `;


        typingElement.appendChild(
            bubble
        );


        messages.appendChild(
            typingElement
        );


        scrollToBottom();

    }


    function hideTyping() {

        if (!typingElement) {
            return;
        }


        typingElement.remove();


        typingElement = null;

    }


    /* =====================================================
       REAL AI RESPONSE
       DIRECT SUPABASE EDGE FUNCTION
       ===================================================== */

    async function generateAIResponse(
        userText
    ) {

        isGenerating = true;

        updateSendButton();

        showTyping();


        try {

            console.log(
                "F-Intelligence: sending request..."
            );


            console.log(
                "F-Intelligence URL:",
                F_INTELLIGENCE_FUNCTION_URL
            );


            console.log(
                "Supabase key available:",
                !!window.F_INTELLIGENCE_SUPABASE_KEY
            );


            /* =============================================
               DIRECT EDGE FUNCTION REQUEST
            ============================================= */

            const response =
                await fetch(
                    F_INTELLIGENCE_FUNCTION_URL,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "apikey":
                                window.F_INTELLIGENCE_SUPABASE_KEY,

                            "Authorization":
                                "Bearer " +
                                window.F_INTELLIGENCE_SUPABASE_KEY
                        },

                        body: JSON.stringify({
                            message: userText
                        })
                    }
                );


            console.log(
                "F-Intelligence HTTP status:",
                response.status
            );


            /* =============================================
               READ RESPONSE
            ============================================= */

            let data = null;


            try {

                data =
                    await response.json();

            }

            catch (jsonError) {

                console.error(
                    "Could not parse Edge Function response:",
                    jsonError
                );


                throw new Error(
                    "Invalid response received from F-Intelligence Edge Function."
                );

            }


            console.log(
                "F-Intelligence response:",
                data
            );


            hideTyping();


            /* =============================================
               HTTP ERROR
            ============================================= */

            if (!response.ok) {

                throw new Error(
                    data?.error ||
                    `Edge Function returned HTTP ${response.status}`
                );

            }


            /* =============================================
               NO DATA
            ============================================= */

            if (!data) {

                throw new Error(
                    "No response received from F-Intelligence."
                );

            }


            /* =============================================
               BACKEND ERROR
            ============================================= */

            if (data.success !== true) {

                throw new Error(
                    data.error ||
                    "F-Intelligence backend returned an error."
                );

            }


            /* =============================================
               EMPTY RESPONSE
            ============================================= */

            if (
                typeof data.reply !== "string" ||
                !data.reply.trim()
            ) {

                throw new Error(
                    "F-Intelligence returned an empty reply."
                );

            }


            /* =============================================
               SUCCESS
            ============================================= */

            const responseText =
                data.reply.trim();


            addMessage(
                "ai",
                responseText
            );


            conversation.push({

                role: "assistant",

                content: responseText,

                timestamp: Date.now()

            });


            console.log(
                "F-Intelligence: response received successfully."
            );

        }


        /* =============================================
           ERROR
           ============================================= */

        catch (error) {

            console.error(
                "F-Intelligence COMPLETE ERROR:",
                error
            );


            hideTyping();


            const errorMessage =
                error?.message ||
                "Unknown error occurred.";


            addMessage(
                "ai",
                "⚠️ F-Intelligence Error:\n\n" +
                errorMessage
            );

        }


        /* =============================================
           FINISH
           ============================================= */

        finally {

            isGenerating =
                false;


            updateSendButton();


            if (messageInput) {

                messageInput.focus();

            }

        }

    }


    /* =====================================================
       OLD TEMPORARY RESPONSE ENGINE
       KEPT FOR BACKUP
       ===================================================== */

    function createTemporaryResponse(
        text
    ) {

        const lower =
            text
                .toLowerCase()
                .trim();


        if (
            lower.includes("hello") ||
            lower.includes("hi") ||
            lower.includes("hey")
        ) {

            return (
                "Hello! 👋\n\n" +
                "I'm F-Intelligence. " +
                "My real AI engine is now connected."
            );

        }


        if (
            lower.includes("who are you") ||
            lower.includes("what are you")
        ) {

            return (
                "I'm F-Intelligence 🤖\n\n" +
                "A standalone AI assistant project."
            );

        }


        if (
            lower.includes("help")
        ) {

            return (
                "Sure! 🧠\n\n" +
                "Tell me what you want help with."
            );

        }


        return (
            "I received your message:\n\n" +
            "“" +
            text +
            "”"
        );

    }


    /* =====================================================
       NEW CHAT
       ===================================================== */

    function newChat() {

        if (isGenerating) {
            return;
        }


        conversation = [];


        if (messages) {

            messages.innerHTML =
                "";

        }


        hideTyping();


        if (welcomeScreen) {

            welcomeScreen.style.display =
                "flex";

        }


        if (messageInput) {

            messageInput.value =
                "";

            autoResizeInput();

            messageInput.focus();

        }

    }


    /* =====================================================
       SCROLL
       ===================================================== */

    function scrollToBottom() {

        if (!chatArea) {
            return;
        }


        requestAnimationFrame(
            function () {

                chatArea.scrollTo({

                    top:
                        chatArea.scrollHeight,

                    behavior:
                        "smooth"

                });

            }
        );

    }


    /* =====================================================
       UTILITY
       ===================================================== */

    function wait(ms) {

        return new Promise(
            function (resolve) {

                setTimeout(
                    resolve,
                    ms
                );

            }
        );

    }


    /* =====================================================
       GLOBAL ACCESS
       ===================================================== */

    window.FIntelligence = {

        sendMessage,

        newChat,

        addMessage,

        getConversation:
            function () {

                return [
                    ...conversation
                ];

            }

    };


    /* =====================================================
       START
       ===================================================== */

    init();

})();