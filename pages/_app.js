import { globalStyles } from 'styles/globalStyles'

function MyApp({ Component, pageProps }) {
	globalStyles();
  return <Component {...pageProps} />
}

export default MyApp
