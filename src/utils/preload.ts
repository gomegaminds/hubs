const preloads: Promise<any>[] = [];

export function waitForPreloads() {
    console.log("Waiting for", preloads);
    return Promise.all(preloads);
}

export function preload<T>(p: Promise<T>) {
    preloads.push(p);
}
