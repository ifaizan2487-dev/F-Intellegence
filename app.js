/* =========================================================
   F-INTELLIGENCE
   APP.JS — FINAL
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

        if (welcomeScreen) {

            welcomeScreen.style.display =
                "none";

        }

        messageInput.value =
            "";

        autoResizeInput();

        addMessage(
            "user",
            text
        );

        conversation.push({

            role: "user",

            content: text,

            timestamp: Date.now()

        });

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
       SUPABASE EDGE FUNCTION
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


            /* ---------------------------------------------
               CHECK SUPABASE CLIENT
               --------------------------------------------- */

            if (!supabaseClient) {

                throw new Error(
                    "Supabase client is not available. Check index.html."
                );

            }


            /* ---------------------------------------------
               CALL EDGE FUNCTION
               --------------------------------------------- */

            const result =
                await supabaseClient.functions.invoke(
                    "hello-world",
                    {
                        body: {
                            message: userText
                        }
                    }
                );


            const data =
                result?.data;

            const error =
                result?.error;


            console.log(
                "F-Intelligence function data:",
                data
            );

            console.log(
                "F-Intelligence function error:",
                error
            );


            /* ---------------------------------------------
               HIDE TYPING
               --------------------------------------------- */

            hideTyping();


            /* ---------------------------------------------
               FUNCTION ERROR
               --------------------------------------------- */

            if (error) {

                console.error(
                    "Supabase Edge Function error:",
                    error
                );

                throw new Error(
                    error.message ||
                    "Failed to send a request to the Edge Function."
                );

            }


            /* ---------------------------------------------
               EMPTY RESPONSE
               --------------------------------------------- */

            if (!data) {

                throw new Error(
                    "No response received from F-Intelligence."
                );

            }


            /* ---------------------------------------------
               BACKEND ERROR
               --------------------------------------------- */

            if (data.success !== true) {

                throw new Error(
                    data.error ||
                    "F-Intelligence backend returned an error."
                );

            }


            /* ---------------------------------------------
               AI REPLY
               --------------------------------------------- */

            const responseText =
                typeof data.reply === "string"
                    ? data.reply.trim()
                    : "";


            if (!responseText) {

                throw new Error(
                    "F-Intelligence returned an empty reply."
                );

            }


            /* ---------------------------------------------
               SHOW AI MESSAGE
               --------------------------------------------- */

            addMessage(
                "ai",
                responseText
            );


            /* ---------------------------------------------
               SAVE CONVERSATION
               --------------------------------------------- */

            conversation.push({

                role: "assistant",

                content: responseText,

                timestamp: Date.now()

            });


            console.log(
                "F-Intelligence: response received successfully."
            );

        }

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

        finally {

            isGenerating = false;

            updateSendButton();

            if (messageInput) {

                messageInput.focus();

            }

        }

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
       START APP
       ===================================================== */

    init();

})();