/**
 * Nanocloud turns any traditional software into a cloud solution, without
 * changing or redeveloping existing source code.
 *
 * Copyright (C) 2016 Nanocloud Software
 *
 * This file is part of Nanocloud.
 *
 * Nanocloud is free software; you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * Nanocloud is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General
 * Public License
 * along with this program.  If not, see
 * <http://www.gnu.org/licenses/>.
 */

/**
 * StorageController
 *
 * @description :: Server-side logic for managing uploads
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* globals AccessToken, PlazaService, Storage, StorageService */


module.exports = {

  /**
   * upload a file in storage
   *
   * @method uploqd
   * @public true
   */

  upload: function(req, res) {
    let user = req.user;

    StorageService.findOrCreate(user)
      .then((storage) => {
        let filename = req.query["filename"];

        req.file(filename).upload({
          maxBytes: 0,
        }, function(err, uploadedFiles) {
          if (err !== null) {
            return res.negotiate(err);
          }

          // If no files were uploaded, respond with an error.
          if (uploadedFiles.length === 0){
            return res.badRequest('No file was uploaded');
          }

          PlazaService.upload(
              storage,
              uploadedFiles[0],
              (_, data) => {
                return res.ok(data);
              });
        });
      });
  },

  /**
   * files get a list of files
   *
   * @method files
   * @public true
   */

  files: function(req, res) {
    let user = req.user;

    StorageService.findOrCreate(user)
      .then((storage) => {
        PlazaService.files(storage, "", "/home/" + storage.username, (files) => {
          res.send(files);
        });
      });
  },

  /**
   * download a file from storage
   *
   * @method download
   * @public true
   */

  download: function(req, res) {
    let filename = req.query["filename"];
    let downloadToken = req.query["token"];

    AccessToken.findById(downloadToken.split(":")[0], (err, accessTokens) => {
      if (err !== null) {
        res.negotiate(err);
      }
      let accessToken = accessTokens[0];

      Storage.findOne({user: accessToken.userId})
        .then((storage) => {
          PlazaService.download(
              storage,
              "/home/" + storage.username + "/" + filename,
              (dataStream) => {
                dataStream.pipe(res.attachment(filename));
              });
        }).catch((err) => {
          res.negotiate(err);
        });
    });
  },

  /**
   * token create a one hour token for download
   *
   * @method tokenn
   * @public true
   */

  token: function(req, res) {
    let user = req.user;
    let filename = req.query["filename"];

    AccessToken.findOne({userId: user.id}, (err, accessToken) => {
      if (err !== null) {
        res.negotiate(err);
      }
      res.send(200, {
        token: StorageService.createToken(accessToken, filename)
      });
    });
  }
};
