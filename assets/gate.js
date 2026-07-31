/* Candado de acceso — capacitaciones pagas.
   Requiere que el script de Clerk (con data-clerk-publishable-key) esté cargado
   en la página antes que este archivo. */
(function () {
  document.documentElement.style.visibility = 'hidden';

  function redirectToSubscribe() {
    var here = encodeURIComponent(window.location.pathname);
    window.location.href = '/suscripcion.html?volver=' + here;
  }

  function reveal() {
    document.documentElement.style.visibility = 'visible';
  }

  function checkAccess() {
    var user = window.Clerk.user;
    if (!user) {
      redirectToSubscribe();
      return;
    }
    var status = user.publicMetadata && user.publicMetadata.subscriptionStatus;
    if (status === 'active') {
      reveal();
    } else {
      redirectToSubscribe();
    }
  }

  function waitForClerk() {
    if (window.Clerk) {
      window.Clerk.load().then(checkAccess);
    } else {
      setTimeout(waitForClerk, 100);
    }
  }

  waitForClerk();
})();
