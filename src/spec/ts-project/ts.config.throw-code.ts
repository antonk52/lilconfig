const err = new Error('Mock TS code error');
// @ts-expect-error: test fixture for code-based error handling
err.code = 'ERR_UNKNOWN_FILE_EXTENSION';
throw err;
