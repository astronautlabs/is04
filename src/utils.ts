export function formEncode(options : any) {
    return Object.keys(options)
        .filter(x => options[x] !== undefined)
        .map(key => `${key}=${encodeURIComponent(options[key])}`)
        .join('&')
    ;
}