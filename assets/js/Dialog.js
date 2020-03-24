export default class Dialog {

    dialogElement;

    constructor() {
        this.dialogElement = $('#dialog');
    }

    showMessage(message) {
        this.dialogElement.find('.modal-footer.okay').show();
        this.dialogElement.find('.modal-footer.decision').hide();
        this.dialogElement.find('.dialog-text').text(message);
        this.dialogElement.modal('show');
    }

    askDialog(func, message) {
        this.dialogElement.find('.modal-footer.okay').hide();
        this.dialogElement.find('.modal-footer.decision').show();
        this.dialogElement.find('.dialog-text').text(message);
        this.dialogElement.find('.button-yes').off();
        this.dialogElement.find('.button-yes').on('click', func);
        this.dialogElement.modal('show');
    }
}