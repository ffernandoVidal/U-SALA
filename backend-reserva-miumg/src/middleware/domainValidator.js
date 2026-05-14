const domainValidator = (req, res, next) => {
  const { email } = req.body; // Se asume que viene del payload de Google

  if (!email || !email.toLowerCase().endsWith('@miumg.edu.gt')) {
    return res.status(403).json({
      error: "Acceso Restringido",
      message: "Debes utilizar tu cuenta institucional de la UMG para acceder."
    });
  }
  next();
};

module.exports = domainValidator;