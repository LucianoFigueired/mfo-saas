const nodeExternals = require('webpack-node-externals');

module.exports = function (options, webpack) {
  return {
    ...options,
    externals: [
      nodeExternals({
        // AQUI ESTÁ O SEGREDO:
        // Dizemos ao Webpack para NÃO ignorar (ou seja, compilar)
        // qualquer pacote que comece com @mfo/common
        allowlist: [/^@mfo\/common/],
      }),
    ],
  };
};
