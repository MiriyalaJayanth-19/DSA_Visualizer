# DSA Visualizer
- This repo will help in visualizing complex data structure algorithms
- This is developed based on the my visualizing capabilities.
- This repo is made by me to help git and github learners .
- This is made with basic javaScript , CSS and html majorly .
  
## Features
- Interactive visualization
- Light/ Dark theme

## 🤝 Contributing

I welcome contributions from beginners who are just getting started with Git and GitHub! If you have a new algorithm to visualize or want to improve the existing project, here is a simple step-by-step guide on how to contribute:

### Step 1: Fork the Repository
Click the **Fork** button at the top right corner of this repository's GitHub page. This will create a copy of this project in your own GitHub account.

### Step 2: Clone your Fork
Open your terminal and clone the forked repository to your local machine:
```sh
git clone https://github.com/YOUR-USERNAME/DSA_Visualizer.git
```
*(Make sure to replace `YOUR-USERNAME` with your actual GitHub username)*

### Step 3: Setup Locally
Navigate into the project folder, install dependencies, and start the local development server:
```sh
cd DSA_Visualizer
npm install
npm run dev
```
Open the provided local URL (e.g., `http://localhost:5173`) in your browser to see the app!

### Step 4: Create a New Branch
Before making changes, create a new branch for your work. Giving your branch a descriptive name helps us understand what you are working on:
```sh
git checkout -b add-new-algorithm
```

### Step 5: Make Your Changes
If you are adding a **new Algorithm visualization**, follow these 3 exact steps:
1. **Register it:** Open `scripts/registry.js` and add a new entry to the `DSA_REGISTRY` array with your problem details (id, title, icon).
2. **Add UI:** Open `index.html` and create a new section for your algorithm (e.g., `<section id="sectionYourId" class="algo-section">...</section>`). Also add the `<script>` tag referencing your new JavaScript file at the bottom of the body.
3. **Add Logic:** Create a `.js` file inside the `scripts/` folder containing the logic for your specific visualization. 

*(If you are just fixing a bug or changing CSS, make the changes directly in the relevant files).*

### Step 6: Commit and Push Your Code
Once you've tested your changes in the browser, commit them:
```sh
git add .
git commit -m "Add [Name of Algorithm] visualization"
```
Then, push your new branch to your forked repository on GitHub:
```sh
git push origin add-new-algorithm
```

### Step 7: Create a Pull Request (PR)
1. Go back to your forked repository page on GitHub. 
2. You will see a banner prompting you to **"Compare & pull request"**. Click it!
3. Add a title and describe the changes you made (bullet points are highly encouraged!). Explain what feature you added or what bug you fixed so that we can review it easily.

Once submitted, your PR will be reviewed and merged. Thank you for contributing and happy coding!

## Access link: 
https://dsa-visualizer-lyart.vercel.app/



