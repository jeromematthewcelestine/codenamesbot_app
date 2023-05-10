module.exports = () => {
  const rewrites = () => {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:7001/:path*",
      },
    ];
  };
  return {
    rewrites,
  };
};