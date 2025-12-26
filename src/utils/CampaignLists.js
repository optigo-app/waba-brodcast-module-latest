export const campaignLists = [
    {
        campaignName: "Promotional Campaign",
        templates: [
            {
                id: "template_notification_1",
                templateName: "Promotional Offer",
                templateLanguage: "en_US",
                templateCategory: "UTILITY",
                campaignName: "Promotional Campaign",
                description: "Send a special offer or discount to engage your customers",
                message: `
              <p>🎉 Hello <strong>Customer Name</strong>!</p>
              <p>We have an exclusive offer for you: <strong>20% OFF</strong>.</p>
              <p>Valid until <strong>31st August</strong>.</p>
              <p>Visit: <a href="https://example.com">Our Store</a></p>
            `,
                templateFooter: null,
                buttons: [],
                headerFormat: "Text",
                defaultImage:
                    "https://images.unsplash.com/photo-1631050165122-626a1377fbce?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            },
            {
                id: "header_noheader_1",
                templateName: "No Header Template",
                templateLanguage: "en_US",
                templateCategory: "UTILITY",
                description: "Message without any header",
                campaignName: "Promotional Campaign",
                headerFormat: "No Header",
                message: `
              <p>👋 Hello <strong>Customer Name</strong>,</p>
              <p>This is a simple message without a header.</p>
            `,
                templateFooter: "Reply STOP to unsubscribe",
                buttons: [
                    { type: "QUICK_REPLY", text: "Yes, Interested" },
                    { type: "QUICK_REPLY", text: "No, Thanks" }
                ],
                defaultImage: null
            },
            {
                id: "template_notification_2",
                templateName: "Flash Sale Alert",
                templateLanguage: "en_US",
                templateCategory: "UTILITY",
                campaignName: "Promotional Campaign",
                description: "Notify customers about a time-limited sale",
                message: `
              <p>⚡ Flash Sale Alert!</p>
              <p>Get <strong>50% OFF</strong> for the next 2 hours only.</p>
              <p>Shop Now 👉 <a href="https://example.com/sale">Click Here</a></p>
            `,
                templateFooter: null,
                buttons: [],
                headerFormat: "Text",
                defaultImage:
                    "https://images.unsplash.com/photo-1631050165122-626a1377fbce?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            }
        ]
    },
    {
        campaignName: "Event / Session Campaign",
        templates: [
            {
                id: "session_qr_1",
                name: "Event / Session QR",
                description: "Send QR code for upcoming event or session",
                defaultMessage: `
            <p>Hi <strong>Customer Name</strong>,</p>
            <p>Scan this QR code to join your exclusive webinar session:</p>
            <p>📅 Date: 28th Aug | 🕒 Time: 5 PM</p>
          `,
                defaultImage: "./qr-code.svg",
            },
            {
                id: "session_invite",
                name: "Event Invitation",
                description: "Invite customers to an event with details",
                defaultMessage: `
            <p>🎤 You are invited!</p>
            <p>Join our <strong>Product Launch</strong> event.</p>
            <p>📅 Date: 1st Sep | 🕒 Time: 6 PM</p>
          `,
                defaultImage: "https://images.unsplash.com/photo-1551836022-d5d88e9218df",
            },
        ],
    },
    {
        campaignName: "Service / Reminder Campaign",
        templates: [
            {
                id: "service_update_1",
                name: "Service Update",
                description: "Notify about service status or updates",
                defaultMessage: `
            <p>Hello <strong>Customer Name</strong>,</p>
            <p>Your service request is in progress.</p>
          `,
                defaultImage: "https://images.unsplash.com/photo-1581092917319-8f3a7f9b7b5a",
            },
            {
                id: "service_reminder_1",
                name: "Appointment Reminder",
                description: "Send appointment reminders",
                defaultMessage: `
            <p>⏰ Reminder!</p>
            <p>Your appointment is tomorrow at <strong>11 AM</strong>.</p>
          `,
                defaultImage: "https://images.unsplash.com/photo-1521791136064-7986c2920216",
            },
        ],
    },
    {
        campaignName: "Festival Campaign",
        templates: [
            {
                id: "festival_greeting_1",
                name: "Festival Greeting",
                description: "Send festival greetings to customers",
                defaultMessage: `
            <p>🌸 Happy Diwali!</p>
            <p>Wishing you joy, prosperity, and happiness.</p>
          `,
                defaultImage: "https://images.unsplash.com/photo-1603898042802-7f22e2c86a9c",
            },
            {
                id: "festival_offer_1",
                name: "Festival Offer",
                description: "Special festive season offers",
                defaultMessage: `
            <p>🎁 Celebrate with us!</p>
            <p>Enjoy <strong>25% OFF</strong> on all products this festive season.</p>
          `,
                defaultImage: "https://images.unsplash.com/photo-1603007943870-444ef98a3299",
            },
        ],
    },
    {
        campaignName: "Birthday Campaign",
        templates: [
            {
                id: "birthday_wish_1",
                name: "Birthday Wish",
                description: "Send birthday greetings",
                defaultMessage: `
            <p>🎂 Happy Birthday <strong>Customer Name</strong>!</p>
            <p>We wish you a wonderful day 🎉</p>
          `,
                defaultImage: "https://images.unsplash.com/photo-1578985545062-69928b1d9587",
            },
            {
                id: "birthday_offer_1",
                name: "Birthday Offer",
                description: "Special birthday discounts",
                defaultMessage: `
            <p>🎁 Celebrate with a gift from us!</p>
            <p>Get <strong>15% OFF</strong> on your purchase today.</p>
          `,
                defaultImage: "https://images.unsplash.com/photo-1599940824399-b87987ceb72a",
            },
        ],
    },
    {
        campaignName: "Feedback Campaign",
        templates: [
            {
                id: "feedback_request_1",
                name: "Feedback Request",
                description: "Ask customers for feedback",
                defaultMessage: `
            <p>Hello <strong>Customer Name</strong>,</p>
            <p>We'd love your feedback on our service 🙏</p>
          `,
                defaultImage: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df",
            },
            {
                id: "review_request_1",
                name: "Review Request",
                description: "Ask customers to leave a review",
                defaultMessage: `
            <p>⭐ Share your experience with us!</p>
            <p>Leave a review and help us improve.</p>
          `,
                defaultImage: "https://images.unsplash.com/photo-1560264280-88b68371db39",
            },
        ],
    },
    {
        campaignName: "New Product Campaign",
        templates: [
            {
                id: "new_product_1",
                name: "Product Launch",
                description: "Announce a new product",
                defaultMessage: `
            <p>🚀 Introducing our latest product!</p>
            <p>Check it out now 👉 <a href="https://example.com/new">Click Here</a></p>
          `,
                defaultImage: "https://images.unsplash.com/photo-1599946404167-3a5a907f9c6c",
            },
            {
                id: "new_product_offer_1",
                name: "New Product Offer",
                description: "Special discounts on new product",
                defaultMessage: `
            <p>🎉 Celebrate our launch!</p>
            <p>Enjoy <strong>10% OFF</strong> this week only.</p>
          `,
                defaultImage: "https://images.unsplash.com/photo-1555529669-8c7c8e71ff54",
            },
        ],
    },
    {
        campaignName: "Seasonal Sale Campaign",
        templates: [
            {
                id: "seasonal_sale_1",
                name: "Winter Sale",
                description: "Announce winter sale",
                defaultMessage: `
            <p>❄️ Winter Special!</p>
            <p>Get up to <strong>40% OFF</strong>.</p>
          `,
                defaultImage: "https://images.unsplash.com/photo-1601597111026-65f7a8d5d5c4",
            },
            {
                id: "seasonal_sale_2",
                name: "Summer Sale",
                description: "Announce summer sale",
                defaultMessage: `
            <p>☀️ Summer Deals!</p>
            <p>Flat <strong>30% OFF</strong> on all products.</p>
          `,
                defaultImage: "https://images.unsplash.com/photo-1601597111026-65f7a8d5d5c4",
            },
        ],
    },
    {
        campaignName: "Loyalty Campaign",
        templates: [
            {
                id: "loyalty_reward_1",
                name: "Loyalty Reward",
                description: "Reward loyal customers",
                defaultMessage: `
            <p>💎 Thank you for being a loyal customer!</p>
            <p>Here’s a <strong>special reward</strong> just for you.</p>
          `,
                defaultImage: "https://images.unsplash.com/photo-1576502200916-7b4f1b36baf6",
            },
            {
                id: "loyalty_points_1",
                name: "Points Update",
                description: "Notify about loyalty points",
                defaultMessage: `
            <p>✨ Your loyalty points balance is <strong>1200</strong>.</p>
            <p>Redeem now for exciting offers!</p>
          `,
                defaultImage: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df",
            },
        ],
    },
    {
        campaignName: "Re-engagement Campaign",
        templates: [
            {
                id: "reengage_1",
                name: "We Miss You",
                description: "Re-engage inactive customers",
                defaultMessage: `
            <p>👋 Hello, we miss you!</p>
            <p>Come back and enjoy <strong>20% OFF</strong> on your next order.</p>
          `,
                defaultImage: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",
            },
            {
                id: "reengage_2",
                name: "Exclusive Comeback Offer",
                description: "Special offer for returning customers",
                defaultMessage: `
            <p>🎁 Welcome back!</p>
            <p>Here’s a <strong>special comeback gift</strong> for you.</p>
          `,
                defaultImage: "https://images.unsplash.com/photo-1495121605193-b116b5b9c5fe",
            },
        ],
    },
];
