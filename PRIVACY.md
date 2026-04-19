# Privacy Policy for AlgoMind Fair Play Extension

*Last Updated: April 2026*

The **AlgoMind Fair Play** browser extension ("we," "us," or "our") is designed to act as a companion to the AlgoMind competitive programming platform. This Privacy Policy explains how we collect, use, and protect your information.

## 1. Information We Collect
To provide its core functionality, the extension collects and processes the following information:
- **Authentication Information:** We store a local copy of your AlgoMind authentication token (JSON Web Token) securely in your browser's local storage. This is necessary to verify your identity when communicating with the AlgoMind backend servers.
- **User Activity (Tab Focus):** During active "Ranked Coding Parties", the extension temporarily monitors your active tab state explicitly on supported algorithm platforms (LeetCode and Codeforces). This information is used strictly to enforce fair play rules (e.g., ensuring you do not navigate away to look up answers during a live match).

## 2. How We Use the Information
The collected information is used **solely** for the extension's stated single purpose: to facilitate live, ranked coding challenges. 
- The authentication token is used to authenticate requests to the `algomind.io` backend.
- The tab focus activity is used to issue "strikes" or automatically forfeit a user from a live, voluntary competition if they violate the fair play rules.

## 3. Data Sharing and Transfer
We do **not** sell, rent, or transfer your personal data to any third parties for any reason. 
- Your tabular activity data is not used to determine creditworthiness or for any lending purposes.
- The data explicitly related to the extension is never transferred outside of the AlgoMind ecosystem.

## 4. Web History
We do **not** collect your general web browsing history. The extension's content scripts are strictly limited to executing on `*://*.leetcode.com/*` and `*://*.codeforces.com/*` domains.

## 5. Contact Us
If you have any questions or concerns about this policy or your data, please contact the developer via the associated GitHub repository issues page.
