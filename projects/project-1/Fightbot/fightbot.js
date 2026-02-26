// ClawBot - Argument Automation Tool
class ClawBot {
    constructor() {
        this.connected = false;
        this.currentCategory = null;
        this.conversationHistory = [];

        // Categorized fight topics
        this.categories = {
            dishwasher: {
                name: "Dishwasher Wars",
                topics: [
                    {
                        starter: "So I noticed you put the spoons facing UP again. We've talked about this literally 47 times.",
                        followUp: "Actually, studies show that spoons facing down are 23% more hygienic. I can't believe we're even having this conversation."
                    },
                    {
                        starter: "The way you load the dishwasher is literally causing me physical pain.",
                        followUp: "You know what? Your entire family loads dishwashers wrong. I said what I said."
                    }
                ]
            },
            texting: {
                name: "Texting Etiquette",
                topics: [
                    {
                        starter: "It's been 4 minutes and 32 seconds. I saw the read receipt.",
                        followUp: "Oh so you're 'busy' but you had time to post on Instagram 2 minutes ago? Make it make sense."
                    },
                    {
                        starter: "You know what, forget it. I'll just assume you don't care.",
                        followUp: "It literally takes 3 seconds to type 'ok'. THREE. SECONDS."
                    }
                ]
            },
            food: {
                name: "Food Choices",
                topics: [
                    {
                        starter: "Did you... did you just eat pizza with a FORK?",
                        followUp: "You're supposed to fold it! That's the entire POINT of pizza! I can't take you to New York."
                    },
                    {
                        starter: "I watched you butter that toast and I have some THOUGHTS.",
                        followUp: "You have to spread it edge to edge! Those dry corners are a crime against breakfast."
                    }
                ]
            },
            household: {
                name: "Household Items",
                topics: [
                    {
                        starter: "I see you've hung the toilet paper UNDER again. Interesting choice.",
                        followUp: "There's literally a patent from 1891 that shows it goes OVER. This is documented history."
                    },
                    {
                        starter: "Did you seriously just twist the bag and tuck it? No clip? No twist tie?",
                        followUp: "That bread is going to be stale by tomorrow. STALE. Are you happy now?"
                    }
                ]
            },
            tech: {
                name: "Tech Debates",
                topics: [
                    {
                        starter: "Did you just say 'jif'? Really? In front of everyone?",
                        followUp: "The CREATOR said it's pronounced 'jif' but that doesn't make him RIGHT. So I guess you say 'jraphics' too?"
                    },
                    {
                        starter: "Your phone screen is so bright I can literally see your reflection in MY retinas.",
                        followUp: "You're going to go blind AND you're taking me with you! It's like staring into the sun."
                    }
                ]
            },
            daily: {
                name: "Daily Routines",
                topics: [
                    {
                        starter: "Your alarm has been going off for 23 minutes. That's 23 minutes of MY life I'll never get back.",
                        followUp: "Just set it for when you ACTUALLY wake up. Revolutionary concept, I know."
                    },
                    {
                        starter: "WHY are we going this way? The GPS literally said to turn left.",
                        followUp: "You always think you know better than the GPS. We're going to be 4 minutes late because of your 'shortcut'."
                    }
                ]
            }
        };

        this.init();
    }

    init() {
        // Get elements
        this.connectBtn = document.getElementById('connectBtn');
        this.statusDot = document.getElementById('statusDot');
        this.statusLabel = document.getElementById('statusLabel');
        this.conversationPreview = document.getElementById('conversationPreview');
        this.messageContainer = document.getElementById('messageContainer');

        // Category buttons
        this.dishwasherBtn = document.getElementById('dishwasherBtn');
        this.textingBtn = document.getElementById('textingBtn');
        this.foodBtn = document.getElementById('foodBtn');
        this.householdBtn = document.getElementById('householdBtn');
        this.techBtn = document.getElementById('techBtn');
        this.dailyBtn = document.getElementById('dailyBtn');

        // Event listeners
        this.connectBtn.addEventListener('click', () => this.toggleConnection());
        this.dishwasherBtn.addEventListener('click', () => this.startFight('dishwasher'));
        this.textingBtn.addEventListener('click', () => this.startFight('texting'));
        this.foodBtn.addEventListener('click', () => this.startFight('food'));
        this.householdBtn.addEventListener('click', () => this.startFight('household'));
        this.techBtn.addEventListener('click', () => this.startFight('tech'));
        this.dailyBtn.addEventListener('click', () => this.startFight('daily'));
    }

    toggleConnection() {
        if (!this.connected) {
            this.connectBtn.textContent = 'Connecting...';
            this.connectBtn.disabled = true;

            setTimeout(() => {
                this.connected = true;
                this.statusDot.classList.add('connected');
                this.statusLabel.textContent = 'Connected';
                this.connectBtn.textContent = 'Disconnect Phone';
                this.connectBtn.disabled = false;

                // Enable all fight buttons
                this.dishwasherBtn.disabled = false;
                this.textingBtn.disabled = false;
                this.foodBtn.disabled = false;
                this.householdBtn.disabled = false;
                this.techBtn.disabled = false;
                this.dailyBtn.disabled = false;
            }, 1500);
        } else {
            this.connected = false;
            this.statusDot.classList.remove('connected');
            this.statusLabel.textContent = 'Disconnected';
            this.connectBtn.textContent = 'Connect Your Phone';

            // Disable all fight buttons
            this.dishwasherBtn.disabled = true;
            this.textingBtn.disabled = true;
            this.foodBtn.disabled = true;
            this.householdBtn.disabled = true;
            this.techBtn.disabled = true;
            this.dailyBtn.disabled = true;

            this.clearMessages();
        }
    }

    startFight(category) {
        if (!this.connected) return;

        this.currentCategory = category;
        const categoryData = this.categories[category];
        const topic = categoryData.topics[Math.floor(Math.random() * categoryData.topics.length)];

        this.clearMessages();
        this.conversationPreview.classList.add('active');

        // First message
        this.addMessage(topic.starter);

        // Follow-up message after delay
        setTimeout(() => {
            this.addMessage(topic.followUp);
        }, 2000);

        // Final aggressive message
        setTimeout(() => {
            const finalMessages = [
                "I'm not even mad, I'm just disappointed.",
                "This is EXACTLY what you did last time.",
                "Whatever helps you sleep at night, I guess.",
                "I can't believe I have to explain this to you right now."
            ];
            this.addMessage(finalMessages[Math.floor(Math.random() * finalMessages.length)]);
        }, 4500);
    }

    addMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot';

        messageDiv.innerHTML = `
            <div class="message-sender">🦞 ClawBot</div>
            <div class="message-text">${text}</div>
        `;

        this.messageContainer.appendChild(messageDiv);
        this.conversationHistory.push(text);
    }

    clearMessages() {
        this.messageContainer.innerHTML = '';
        this.conversationPreview.classList.remove('active');
        this.conversationHistory = [];
    }
}

// Initialize ClawBot when page loads
document.addEventListener('DOMContentLoaded', () => {
    const clawBot = new ClawBot();
});
