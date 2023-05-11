module.exports = () => {
  const rewrites = () => {
    return [
      {
        source: "/api/:path*",
        destination: "https://codenamesbot.herokuapp.com/:path*",
      },
    ];
  };
  return {
    rewrites,
  };
};