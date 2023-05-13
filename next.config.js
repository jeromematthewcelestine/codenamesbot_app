module.exports = () => {
  const rewrites = () => {
    return [
      {
        source: "/api/:path*",
        destination: "https://codenamesbot.herokuapp.com/:path*",
        // destination: "http://127.0.0.1:5001/:path*"
      },
    ];
  };
  return {
    rewrites,
  };
};