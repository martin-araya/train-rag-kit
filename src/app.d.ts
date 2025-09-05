// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	// Extend the window interface
	interface Window {
		jspdf: { [key: string]: unknown }; // Define a more specific type for jsPDF if you have one
	}

	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
