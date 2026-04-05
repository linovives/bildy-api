const sanitizeObject = (data) => {
    if (Array.isArray(data)) {
        return data.map(sanitizeObject);
    }

    if (data !== null && typeof data === "object") {
        return Object.keys(data).reduce((acc, key) => {
            const cleanKey = key.replace(/^\$+/g, "").replace(/\./g, "");
            
            acc[cleanKey] = sanitizeObject(data[key]);
            return acc;
        }, {});
    }

    return data;
};

const mongoSanitizeMiddleware = (req, res, next) => {
    const targets = ['body', 'params', 'query'];

    targets.forEach(target => {
        if (req[target]) {
            if (target === 'query') {
                const cleanQuery = sanitizeObject(req.query);
                Object.keys(req.query).forEach(key => delete req.query[key]);
                Object.assign(req.query, cleanQuery);
            } else {
                req[target] = sanitizeObject(req[target]);
            }
        }
    });

    next();
};

export default mongoSanitizeMiddleware;