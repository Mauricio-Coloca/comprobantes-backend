const express = require("express");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const pool = require("../db/db"); // Importar la conexión a la base de datos
const router = express.Router();

// Ruta para obtener los tipos de comprobantes
router.get("/types", (req, res) => {
  const types = [
    { type: "Colombia", fields: ["Nombre", "Cédula", "Cuenta de Destino", "Monto"] },
    { type: "Pix", fields: ["Nombre", "CPF/CNPJ", "Tipo de Chave", "Chave", "Monto"] },
    { type: "México", fields: ["Nombre", "Clabe", "Monto"] },
    {
      type: "INVOICE",
      fields: ["Nombre Beneficiario", "Email", "Número de Registro", "Moneda", "Monto", "Concepto"],
    },
    { type: "Ecuador", fields: ["Nombre", "Tipo de Cuenta", "Numero de cuenta", "Banco", "Monto"] },
    {
      type: "General",
      fields: ["Nombre", "Número de Documento", "País", "Número de Cuenta", "Monto", "Moneda"],
    },
  ];
  res.status(200).json(types);
});



const generatePixPDF = (data, res) => {
  const doc = new PDFDocument({
    size: [800, 1200],
    margins: { top: 80, bottom: 50, left: 90, right: 90 }, // Márgenes ajustados
  });
  const filePath = `comprobante_pix_${Date.now()}.pdf`;
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  // Título del comprobante
  doc
    .fontSize(50)
    .font("Helvetica-Bold")
    .lineGap(12) // Espaciado para el título principal
    .text("Comprovante Pix", {
      align: "center",
    })
    .moveDown(0.8);

  // Función para dibujar clave-valor
  const drawKeyValue = (key, value) => {
    const pageWidth = doc.page.width - doc.options.margins.left - doc.options.margins.right;
    const keyWidth = pageWidth * 0.4; // 40% del ancho para las claves
    const valueWidth = pageWidth - keyWidth - 60; // Espacio restante para los valores
    const valueStartX = doc.options.margins.left + keyWidth + 60;

    const y = doc.y; // Mantener la misma línea base

    // Clave
    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .lineGap(8) // Espaciado entre las claves
      .text(key, doc.options.margins.left, y, { width: keyWidth, align: "left" });

    // Valor alineado a la derecha
    doc
      .font("Helvetica")
      .fontSize(20)
      .lineGap(8) // Espaciado entre los valores
      .text(value, valueStartX, y, { width: valueWidth, align: "right" });
  };

  // Datos de transferencia
  const pageWidth = doc.page.width - doc.options.margins.left - doc.options.margins.right;

  // Formatear monto en el formato brasileño
  const formattedMonto = parseFloat(data.monto || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  // Título: Dados da transferência
  const title1Width = doc.widthOfString("Dados da transferência");
  const title1X = (pageWidth - title1Width) / 0.5 + doc.options.margins.left; // Ajustar este valor si necesitas mover el título
  doc
    .fontSize(30)
    .font("Helvetica-Bold")
    .lineGap(10) // Espaciado para el título
    .text("Dados da transferência", title1X, doc.y, { underline: false });
  doc.moveDown(1);

  drawKeyValue("Valor", formattedMonto || "N/A");
  drawKeyValue("Data e hora", `${new Date().toLocaleString("pt-BR")}`);
  doc.moveDown(2);

  // Título: Dados do remetente
  const title2Width = doc.widthOfString("Dados do remetente");
  const title2X = (pageWidth - title2Width) / 2.8 + doc.options.margins.left; // Ajustar este valor si necesitas mover el título
  doc
    .fontSize(30)
    .font("Helvetica-Bold")
    .lineGap(10) // Espaciado para el título
    .text("Dados do remetente", title2X, doc.y, { underline: false });
  doc.moveDown(1);

  drawKeyValue("Nome", "Avoi Servicos Digitais LTDA");
  drawKeyValue("CPF/CNPJ", "55.063.975/0001-50");
  drawKeyValue("Banco", "382 - FIDUCIA SCMEPP LTDA");
  drawKeyValue("Agência", "0001");
  drawKeyValue("Conta", "38090-7");
  doc.moveDown(2);

  // Título: Dados do Destinatário
  const title3Width = doc.widthOfString("Dados do Destinatário");
  const title3X = (pageWidth - title3Width) / 2.95 + doc.options.margins.left; // Ajustar este valor si necesitas mover el título
  doc
    .fontSize(30)
    .font("Helvetica-Bold")
    .lineGap(10) // Espaciado para el título
    .text("Dados do Destinatário", title3X, doc.y, { underline: false });
  doc.moveDown(1);

  drawKeyValue("Nome", data.nombre || "N/A");
  drawKeyValue("CPF/CNPJ", data["cpf/cnpj"] || "N/A");
  drawKeyValue("Tipo de chave", data["tipo_de_chave"] || "N/A");
  drawKeyValue("Chave", data["chave"] || "N/A");
  doc.moveDown(2);

  // Logo centrado en la parte inferior
  doc.image("logo.png", doc.page.width / 2 - 276, doc.page.height - 180, { width: 550 });

  // Finalizar documento
  doc.end();

  writeStream.on("finish", () => {
    res.download(filePath, () => {
      fs.unlinkSync(filePath);
    });
  });

  writeStream.on("error", (err) => {
    console.error("Error al escribir el archivo PDF:", err);
    res.status(500).send("Error al generar el archivo PDF.");
  });
};

const generateColombiaPDF = (data, res) => {
  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: 70, bottom: 50, left: 50, right: 50 },
  });
  const filePath = `comprobante_colombia_${Date.now()}.pdf`;
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  // Encabezado con título
  doc
    .fillColor("#00B022")
    .fontSize(32) // Título más grande
    .font("Helvetica-Bold")
    .text("Transferencia Exitosa", { align: "center" });

  // Fecha y hora centrada más cerca del título
  const fechaHora = new Date().toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  });
  doc
    .moveDown(0) // Menor espacio entre título y fecha
    .fontSize(12)
    .fillColor("#000000")
    .font("Helvetica")
    .text(`Fecha y hora: ${fechaHora}`, { align: "center" });

  // Línea divisoria bajo el encabezado
  doc
    .moveTo(50, doc.y + 30)
    .lineTo(550, doc.y + 30)
    .lineWidth(1)
    .strokeColor("#D3D3D3")
    .stroke();

  // Espacio antes de las secciones
  doc.moveDown(5);

  // Información del receptor
  doc
    .fontSize(16)
    .fillColor("#000000")
    .font("Helvetica-Bold")
    .text("Información del Receptor", { align: "left" })
    .moveDown(0.5)
    .font("Helvetica")
    .fontSize(14)
    .lineGap(10)
    .text(`${data.nombre || "N/A"}`) // Solo muestra el valor
    .text(`${data.cedula || "N/A"}`) // Solo muestra el valor
    .text(`${data.cuenta_de_destino || "N/A"}`) // Solo muestra el valor
    .text(
      `${parseFloat(data.monto || 0).toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
      })}`
    );

  // Línea divisoria entre secciones
  doc
    .moveDown(1)
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .lineWidth(1)
    .strokeColor("#D3D3D3")
    .stroke();

  // Espacio antes de la sección del remitente
  doc.moveDown(2);

  // Información del remitente
  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .text("Información del Remitente", { align: "left" })
    .moveDown(-0.5)
    .font("Helvetica")
    .fontSize(14)
    .lineGap(10)
    .text("Coloca Group S.A.S.")
    .text("901820031")
    .text("25900002683");

  // Línea divisoria final más cercana al contenido
  doc
    .moveDown(1.5) // Espacio reducido entre remitente y pie
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .lineWidth(1)
    .strokeColor("#00B022")
    .stroke();

  // Pie de página con logo más grande y centrado
  const pieY = doc.y + 20;
  doc
    .image("logo.png", doc.page.width / 2 - 90, pieY, { width: 180 }) // Logo más grande
    .moveDown(4)
    .font("Helvetica")
    .fontSize(12)
    .fillColor("#7D7D7D")
    .text(
      "Gracias por usar Coloca Payments. Si tienes alguna duda, contáctanos:",
      { align: "center" }
    )
    .text("Correo: hello@colocapayments.com", { align: "center" })
    .text("Teléfono: +57 300 2407308", { align: "center" });

  // Finalizar documento
  doc.end();

  writeStream.on("finish", () => {
    res.download(filePath, () => {
      fs.unlinkSync(filePath);
    });
  });

  writeStream.on("error", (err) => {
    console.error("Error al escribir el archivo PDF:", err);
    res.status(500).send("Error al generar el archivo PDF.");
  });
};


const generateMexicoPDF = (data, res) => {
  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: 70, bottom: 50, left: 50, right: 50 },
  });
  const filePath = `comprobante_mexico_${Date.now()}.pdf`;
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  // Encabezado con título
  doc
    .fillColor("#00B022")
    .fontSize(32) // Título grande
    .font("Helvetica-Bold")
    .text("Transferencia Exitosa", { align: "center" });

  // Fecha y hora centrada más cerca del título
  const fechaHora = new Date().toLocaleString("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  });
  doc
    .moveDown(0) // Menor espacio entre título y fecha
    .fontSize(12)
    .fillColor("#000000")
    .font("Helvetica")
    .text(`Fecha y hora: ${fechaHora}`, { align: "center" });

  // Línea divisoria bajo el encabezado
  doc
    .moveTo(50, doc.y + 30)
    .lineTo(550, doc.y + 30)
    .lineWidth(1)
    .strokeColor("#D3D3D3")
    .stroke();

  // Espacio antes de las secciones
  doc.moveDown(5);

  // Información del receptor
  doc
    .fontSize(16)
    .fillColor("#000000")
    .font("Helvetica-Bold")
    .text("Información del Receptor", { align: "left" })
    .moveDown(0.5)
    .font("Helvetica")
    .fontSize(14)
    .lineGap(10)
    .text(`${data.nombre || "N/A"}`) // Solo muestra el valor
    .text(`${data.clabe || "N/A"}`) // Solo muestra el valor
    .text(
      `${parseFloat(data.monto || 0).toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN",
      })}`
    );

  // Línea divisoria entre secciones
  doc
    .moveDown(1)
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .lineWidth(1)
    .strokeColor("#D3D3D3")
    .stroke();

  // Espacio antes de la sección del remitente
  doc.moveDown(2);

  // Información del remitente
  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .text("Información del Remitente", { align: "left" })
    .moveDown(-0.5)
    .font("Helvetica")
    .fontSize(14)
    .lineGap(10)
    .text("Coloca Group S.A.S.")
    .text("Nvio")
    .text("710969000039534172");

  // Línea divisoria final más cercana al contenido
  doc
    .moveDown(1.5) // Espacio reducido entre remitente y pie
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .lineWidth(1)
    .strokeColor("#00B022")
    .stroke();

  // Pie de página con logo más grande y centrado
  const pieY = doc.y + 20;
  doc
    .image("logo.png", doc.page.width / 2 - 90, pieY, { width: 180 }) // Logo más grande
    .moveDown(4)
    .font("Helvetica")
    .fontSize(12)
    .fillColor("#7D7D7D")
    .text(
      "Gracias por usar Coloca Payments. Si tienes alguna duda, contáctanos:",
      { align: "center" }
    )
    .text("Correo: hello@colocapayments.com", { align: "center" })
    .text("Teléfono: +57 300 2407308", { align: "center" });

  // Finalizar documento
  doc.end();

  writeStream.on("finish", () => {
    res.download(filePath, () => {
      fs.unlinkSync(filePath);
    });
  });

  writeStream.on("error", (err) => {
    console.error("Error al escribir el archivo PDF:", err);
    res.status(500).send("Error al generar el archivo PDF.");
  });
};

const generateEcuadorPDF = (data, res) => {
  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: 70, bottom: 50, left: 50, right: 50 },
  });
  const filePath = `comprobante_ecuador_${Date.now()}.pdf`;
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  // Encabezado con título
  doc
    .fillColor("#00B022")
    .fontSize(32) // Título más grande
    .font("Helvetica-Bold")
    .text("Transferencia Exitosa", { align: "center" });

  // Fecha y hora centrada más cerca del título
  const fechaHora = new Date().toLocaleString("es-EC", {
    dateStyle: "short",
    timeStyle: "short",
  });
  doc
    .moveDown(0) // Menor espacio entre título y fecha
    .fontSize(12)
    .fillColor("#000000")
    .font("Helvetica")
    .text(`Fecha y hora: ${fechaHora}`, { align: "center" });

  // Línea divisoria bajo el encabezado
  doc
    .moveTo(50, doc.y + 30)
    .lineTo(550, doc.y + 30)
    .lineWidth(1)
    .strokeColor("#D3D3D3")
    .stroke();

  // Espacio antes de las secciones
  doc.moveDown(5);

  // Información del receptor
  doc
    .fontSize(16)
    .fillColor("#000000")
    .font("Helvetica-Bold")
    .text("Información del Receptor", { align: "left" })
    .moveDown(0.5)
    .font("Helvetica")
    .fontSize(14)
    .lineGap(10)
    .text(`${data.nombre || "N/A"}`) // Solo muestra el valor
    .text(`${data.tipo_de_cuenta || "N/A"}`) // Solo muestra el valor
    .text(`${data.numero_de_cuenta || "N/A"}`) // Solo muestra el valor
    .text(`${data.banco || "N/A"}`) // Solo muestra el valor
    .text(
      `${parseFloat(data.monto || 0).toLocaleString("es-EC", {
        style: "currency",
        currency: "USD",
      })}`
    );

  // Línea divisoria entre secciones
  doc
    .moveDown(1)
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .lineWidth(1)
    .strokeColor("#D3D3D3")
    .stroke();

  // Espacio antes de la sección del remitente
  doc.moveDown(2);

  // Información del remitente
  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .text("Información del Remitente", { align: "left" })
    .moveDown(-0.5)
    .font("Helvetica")
    .fontSize(14)
    .lineGap(10)
    .text("Coloca Group S.A.S.")
    .text("COPP DE AHORRO Y CREDITO LIMITADA MIFEX")
    .text("Ahorros");

  // Línea divisoria final más cercana al contenido
  doc
    .moveDown(1.5) // Espacio reducido entre remitente y pie
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .lineWidth(1)
    .strokeColor("#00B022")
    .stroke();

  // Pie de página con logo más grande y centrado
  const pieY = doc.y + 20;
  doc
    .image("logo.png", doc.page.width / 2 - 90, pieY, { width: 180 }) // Logo más grande
    .moveDown(4)
    .font("Helvetica")
    .fontSize(12)
    .fillColor("#7D7D7D")
    .text(
      "Gracias por usar Coloca Payments. Si tienes alguna duda, contáctanos:",
      { align: "center" }
    )
    .text("Correo: hello@colocapayments.com", { align: "center" })
    .text("Teléfono: +57 300 2407308", { align: "center" });

  // Finalizar documento
  doc.end();

  writeStream.on("finish", () => {
    res.download(filePath, () => {
      fs.unlinkSync(filePath);
    });
  });

  writeStream.on("error", (err) => {
    console.error("Error al escribir el archivo PDF:", err);
    res.status(500).send("Error al generar el archivo PDF.");
  });
};

// Ajustes en la tabla del invoice
const generateInvoicePDF = (data, res) => {
  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: 70, bottom: 50, left: 50, right: 50 },
  });

  const filePath = `invoice_${Date.now()}.pdf`;
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  // Logo y encabezado
  doc
    .image("logo.png", 50, 30, { width: 120 }) // Logo en la parte superior izquierda
    .font("Helvetica-Bold")
    .fontSize(24)
    .text("INVOICE", 50, 50, { align: "center" });

  // Detalles de contacto y fecha
  doc
    .fontSize(10)
    .font("Helvetica")
    .text("Coloca Group S.A.S.", 50, 80)
    .text("NIT 901820031", 50, 95)
    .text("CR 47 A 39 61 SUR, Antioquia, Envigado", 50, 110)
    .text("Colombia", 50, 125)
    .font("Helvetica-Bold")
    .text(`TOTAL`, 450, 80, { align: "right" })
    .fontSize(20)
    .text(`USD ${parseFloat(data.monto || 0).toLocaleString("en-US")}`, 450, 100, {
      align: "right",
    })
    .font("Helvetica")
    .fontSize(10)
    .text(`No: ${data.invoiceNumber || "N/A"}`, 450, 125, { align: "right" })
    .text(`Date: ${new Date().toLocaleDateString("en-US")}`, 450, 140, {
      align: "right",
    });

  // Línea divisoria
  doc
    .moveTo(50, 160)
    .lineTo(550, 160)
    .strokeColor("#D3D3D3")
    .stroke();

  // Información del beneficiario
  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("Nombre Beneficiario:", 50, 180)
    .font("Helvetica")
    .text(data.nombre || "TEST BENEFICIARY", 180, 180) // Conexión directa al input de "nombre"
    .font("Helvetica-Bold")
    .text("Email:", 50, 200)
    .font("Helvetica")
    .text(data.email || "test@example.com", 180, 200) // Conexión directa al input de "email"
    .font("Helvetica-Bold")
    .text("Número de Registro:", 50, 220)
    .font("Helvetica")
    .text(data.numero_registro || "123456789", 180, 220); // Conexión directa al input de "numero_registro"

  // Tabla de detalles de pago con alineación
  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("CURRENCY", 50, 260) // Alineado a la izquierda
    .text("CONCEPT", -120, 260, { align: "center" }) // Centrado
    .text("AMOUNT", 450, 260, { align: "right" }) // Alineado a la derecha
    .moveTo(50, 275)
    .lineTo(550, 275)
    .strokeColor("#00B022")
    .stroke();

  // Datos de la tabla
  doc
    .font("Helvetica")
    .fontSize(12)
    .text(data.moneda || "USD", 50, 290) // Alineado a la izquierda
    .text(data.concepto || "Test Concept", -120, 290, { align: "center" }) // Conexión directa al input de "concepto"
    .text(
      parseFloat(data.monto || 0).toLocaleString("en-US"),
      450,
      290,
      { align: "right" }
    );

  // Línea divisoria antes del pie de página
  doc
    .moveTo(50, 310)
    .lineTo(550, 310)
    .strokeColor("#D3D3D3")
    .stroke();

  // Pie de página
  doc
    .image("logo.png", 156, 630, { width: 300 }) // Logo más grande y centrado
    .fontSize(10)
    .font("Helvetica")
    .text(
      "Thank you for using Coloca Payments. If you have any questions, contact us:",
      50,
      700,
      { align: "center" }
    )
    .text("Email: hello@colocapayments.com", { align: "center" })
    .text("Phone: +57 300 2407308", { align: "center" });

  // Finalizar documento
  doc.end();

  writeStream.on("finish", () => {
    res.download(filePath, () => {
      fs.unlinkSync(filePath);
    });
  });

  writeStream.on("error", (err) => {
    console.error("Error al escribir el archivo PDF:", err);
    res.status(500).send("Error al generar el archivo PDF.");
  });
};

const generateGeneralPDF = (data, res) => {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 80, bottom: 80, left: 70, right: 70 },
  });

  const filePath = `comprobante_general_${Date.now()}.pdf`;
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  // Título principal
  doc
    .fontSize(32)
    .font("Helvetica-Bold")
    .text("Comprobante", { align: "center" })
    .moveDown(2);

  // Datos del remitente
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .text("Datos del Remitente", { align: "center" })
    .moveDown(1);

  // Función para dibujar clave-valor
  const drawKeyValue = (key, value) => {
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text(key, { continued: true })
      .font("Helvetica")
      .text(value || "N/A", { align: "right" });
  };

  drawKeyValue("Nombre", "Coloca Group S.A.S.");
  drawKeyValue("Número de Documento", "901820031");
  doc.moveDown(2);

  // Datos del destinatario
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .text("Datos del Destinatario", { align: "center" })
    .moveDown(1);

  drawKeyValue("Nombre", data.nombre || "N/A");
  drawKeyValue("Número de Documento", data.numero_de_documento || "N/A");
  drawKeyValue("País", data.pais || "N/A");
  drawKeyValue("Número de Cuenta", data.numero_de_cuenta || "N/A");
  drawKeyValue("Moneda", data.moneda || "N/A");
  drawKeyValue("Monto", parseFloat(data.monto).toLocaleString("en-US"));
  doc.moveDown(4);

  // Logo centrado en la parte inferior
  doc.image("logo.png", doc.page.width / 2 - 100, doc.page.height - 120, {
    width: 200,
  });

  // Finalizar documento
  doc.end();

  writeStream.on("finish", () => {
    res.download(filePath, () => {
      fs.unlinkSync(filePath);
    });
  });

  writeStream.on("error", (err) => {
    console.error("Error al escribir el archivo PDF:", err);
    res.status(500).send("Error al generar el archivo PDF.");
  });
};










router.post("/generate/:type", async (req, res) => {
  const { type } = req.params;
  const { usuario_id, ...data } = req.body;

  if (!usuario_id || Object.keys(data).length === 0) {
    return res.status(400).send("Todos los campos obligatorios deben ser completados.");
  }

  console.log("Datos recibidos para generar comprobante:", data);

  try {
    await pool.query(
      "INSERT INTO comprobantes (tipo_comprobante, datos, usuario_id) VALUES ($1, $2, $3)",
      [type, data, usuario_id]
    );

    // Generar el PDF según el tipo de comprobante
    if (type === "Pix") {
      generatePixPDF(data, res);
    } else if (type === "Colombia") {
      generateColombiaPDF(data, res);
    } else if (type === "Ecuador") {
      generateEcuadorPDF(data, res);
    } else if (type === "México") {
      generateMexicoPDF(data, res);
    } else if (type === "INVOICE") {
      generateInvoicePDF(data, res);
    } else if (type === "General") {
      generateGeneralPDF(data, res);
    } else {
      res.status(400).send(`El tipo de comprobante "${type}" no es compatible.`);
    }
  } catch (error) {
    console.error(`Error al generar comprobante de ${type}:`, error);
    res.status(500).send("Error al generar el comprobante.");
  }
});

// Ruta para obtener el historial de comprobantes
router.get("/history", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, tipo_comprobante, datos, fecha FROM comprobantes ORDER BY fecha DESC"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error al obtener el historial de comprobantes:", error);
    res.status(500).send("Error al obtener el historial.");
  }
});

// Ruta para descargar un comprobante
router.get("/download/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("SELECT * FROM comprobantes WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).send("Comprobante no encontrado.");
    }

    const comprobante = result.rows[0];

    // Generar y descargar el PDF según el tipo de comprobante
    if (comprobante.tipo_comprobante === "Pix") {
      generatePixPDF(comprobante.datos, res);
    } else if (comprobante.tipo_comprobante === "Colombia") {
      generateColombiaPDF(comprobante.datos, res);
    } else if (comprobante.tipo_comprobante === "Ecuador") {
      generateEcuadorPDF(comprobante.datos, res);
    } else if (comprobante.tipo_comprobante === "México") {
      generateMexicoPDF(comprobante.datos, res);
    } else if (comprobante.tipo_comprobante === "INVOICE") {
      generateInvoicePDF(comprobante.datos, res);
    } else if (comprobante.tipo_comprobante === "General") {
      generateGeneralPDF(comprobante.datos, res);
    } else {
      res
        .status(400)
        .send(
          "Solo comprobantes Pix, Colombia, Ecuador, México, INVOICE y General pueden descargarse en este momento."
        );
    }
  } catch (error) {
    console.error("Error al descargar el comprobante:", error);
    res.status(500).send("Error al descargar el comprobante.");
  }
});

module.exports = router;
