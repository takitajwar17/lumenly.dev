# flex-template
This is a project built with [lumenly.dev](https://lumenly.dev) using [Convex](https://convex.dev) as its backend.

## Installation

### 1. Git Clone Template

```bash
git clone git@github.com:get-convex/flex-template.git
cd flex-template
```

### 2. Create a Convex project:

```bash
npx convex login
npx convex init --empty
```

### 3. Run the app

lumenly.dev apps use [Convex Auth](https://auth.convex.dev/) with Anonymous auth for easy sign in. You may wish to change this before deploying your app.

```bash
npm i && npm run dev
```

Once the app is running, you'll need to sign in (anonymously) and then create a room from the app's interface.

## Project structure
  
The frontend code is in the `app` directory and is built with [Vite](https://vitejs.dev/).
  
The backend code is in the `convex` directory.
  
`npm run dev` will start the frontend and backend servers.

## App authentication

Chef apps use [Convex Auth](https://auth.convex.dev/) with Anonymous auth for easy sign in. You may wish to change this before deploying your app.

## Developing and deploying your app

Check out the [Convex docs](https://docs.convex.dev/) for more information on how to develop with Convex.
* If you're new to Convex, the [Overview](https://docs.convex.dev/understanding/) is a good place to start
* Check out the [Hosting and Deployment](https://docs.convex.dev/production/) docs for how to deploy your app
* Read the [Best Practices](https://docs.convex.dev/understanding/best-practices/) guide for tips on how to improve you app further
