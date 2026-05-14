const validateMiumgDomain = (req, res, next) => {
    const { email } = req.body;
    if (!email.endsWith('@miumg.edu.gt')) {
        return res.status(403).json({ 
            error: "Acceso denegado. Se requiere correo institucional @miumg.edu.gt" 
        });
    }
    next();
};