const originalFetch = function() { console.log('original fetch called with', arguments); return Promise.resolve('ok'); };
const window = { fetch: originalFetch };
let csrfToken = 'mock-token';

window.fetch = async function() {
    let [resource, config] = arguments;
    config = config || {};
    config.credentials = 'same-origin';
    if(config.method && (config.method.toUpperCase() === 'POST' || config.method.toUpperCase() === 'PUT' || config.method.toUpperCase() === 'DELETE')) {
        config.headers = config.headers || {};
        config.headers['CSRF-Token'] = csrfToken;
    }
    return originalFetch.call(window, resource, config);
};

window.fetch('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"phone":"9876543210"}' })
.then(console.log);
